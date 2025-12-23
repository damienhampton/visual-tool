import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionTier } from '../entities/subscription.entity';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('subscriptions')
export class SubscriptionsController {
  private stripe: Stripe;

  constructor(
    private subscriptionsService: SubscriptionsService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey || stripeKey === 'sk_test_51placeholder') {
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserSubscription(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage')
  async getUsageStats(@CurrentUser() user: any) {
    return this.subscriptionsService.getUsageStats(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckoutSession(
    @CurrentUser() user: any,
    @Body() body: { tier: SubscriptionTier; successUrl: string; cancelUrl: string },
  ) {
    const { tier, successUrl, cancelUrl } = body;

    if (!tier || !successUrl || !cancelUrl) {
      throw new BadRequestException('Missing required fields');
    }

    if (tier !== SubscriptionTier.PRO && tier !== SubscriptionTier.TEAM) {
      throw new BadRequestException('Invalid subscription tier');
    }

    return this.subscriptionsService.createCheckoutSession(
      user.sub,
      tier,
      successUrl,
      cancelUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async createBillingPortalSession(
    @CurrentUser() user: any,
    @Body() body: { returnUrl: string },
  ) {
    const { returnUrl } = body;

    if (!returnUrl) {
      throw new BadRequestException('Missing returnUrl');
    }

    return this.subscriptionsService.createBillingPortalSession(user.sub, returnUrl);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!sig || !webhookSecret) {
      throw new BadRequestException('Missing signature or webhook secret');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    await this.subscriptionsService.handleWebhookEvent(event);

    return { received: true };
  }
}
