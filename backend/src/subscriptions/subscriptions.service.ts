import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription, SubscriptionTier, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { Diagram } from '../entities/diagram.entity';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey || stripeKey.includes('placeholder')) {
      console.warn('⚠️  Stripe API key not configured. Subscription features will be limited.');
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeKey);
      console.log('✅ Stripe initialized successfully');
    }
  }

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        userId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription> {
    return this.getOrCreateSubscription(userId);
  }

  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (tier === SubscriptionTier.FREE) {
      throw new BadRequestException('Cannot create checkout for free tier');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      subscription.stripeCustomerId = customerId;
      await this.subscriptionRepository.save(subscription);
    }

    const priceId = tier === SubscriptionTier.PRO
      ? this.configService.get('STRIPE_PRO_PRICE_ID')
      : this.configService.get('STRIPE_TEAM_PRICE_ID');

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        name: 'auto',
      },
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tier,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async createBillingPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeCustomerId) {
      throw new BadRequestException('No billing information found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) return;

    const subscription = await this.getOrCreateSubscription(userId);
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    subscription.tier = tier;
    subscription.status = stripeSubscription.status as SubscriptionStatus;
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.stripePriceId = stripeSubscription.items.data[0].price.id;
    subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
    subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
    subscription.cancelAtPeriodEnd = (stripeSubscription as any).cancel_at_period_end;

    await this.subscriptionRepository.save(subscription);
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    subscription.status = stripeSubscription.status as SubscriptionStatus;
    subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
    subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
    subscription.cancelAtPeriodEnd = (stripeSubscription as any).cancel_at_period_end;

    if ((stripeSubscription as any).canceled_at) {
      subscription.canceledAt = new Date((stripeSubscription as any).canceled_at * 1000);
    }

    await this.subscriptionRepository.save(subscription);
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    subscription.tier = SubscriptionTier.FREE;
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();

    await this.subscriptionRepository.save(subscription);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: (invoice as any).subscription as string },
    });

    if (!subscription) return;

    subscription.status = SubscriptionStatus.PAST_DUE;
    await this.subscriptionRepository.save(subscription);
  }

  async checkDiagramLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
    const subscription = await this.getOrCreateSubscription(userId);
    const diagramCount = await this.diagramRepository.count({
      where: { ownerId: userId },
    });

    // Treat non-active subscriptions as free tier (payment failed, canceled, etc.)
    const isActivePaidTier = 
      subscription.tier !== SubscriptionTier.FREE && 
      subscription.status === SubscriptionStatus.ACTIVE;

    let limit: number;
    if (isActivePaidTier) {
      limit = -1; // Unlimited for active Pro/Team subscriptions
    } else {
      limit = 3; // Free tier limit
    }

    return {
      allowed: limit === -1 || diagramCount < limit,
      limit,
      current: diagramCount,
    };
  }

  async getUsageStats(userId: string): Promise<{
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    diagramCount: number;
    diagramLimit: number;
    currentPeriodEnd: Date | null;
  }> {
    const subscription = await this.getOrCreateSubscription(userId);
    const diagramCount = await this.diagramRepository.count({
      where: { ownerId: userId },
    });

    let diagramLimit: number;
    switch (subscription.tier) {
      case SubscriptionTier.FREE:
        diagramLimit = 3;
        break;
      case SubscriptionTier.PRO:
      case SubscriptionTier.TEAM:
        diagramLimit = -1;
        break;
      default:
        diagramLimit = 3;
    }

    return {
      tier: subscription.tier,
      status: subscription.status,
      diagramCount,
      diagramLimit,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }
}
