import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Diagram } from '../entities/diagram.entity';
import { DiagramVersion } from '../entities/diagram-version.entity';
import { DiagramCollaborator } from '../entities/diagram-collaborator.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { EmailService } from '../email/email.service';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    @InjectRepository(DiagramVersion)
    private diagramVersionRepository: Repository<DiagramVersion>,
    @InjectRepository(DiagramCollaborator)
    private collaboratorRepository: Repository<DiagramCollaborator>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private emailService: EmailService,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      newUsersToday,
      newUsersWeek,
      totalDiagrams,
      diagramsCreatedToday,
      totalSubscriptions,
      activeSubscriptions,
      proSubscriptions,
      teamSubscriptions,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { updatedAt: MoreThan(oneDayAgo) },
      }),
      this.userRepository.count({
        where: { updatedAt: MoreThan(oneWeekAgo) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThan(oneDayAgo) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThan(oneWeekAgo) },
      }),
      this.diagramRepository.count(),
      this.diagramRepository.count({
        where: { createdAt: MoreThan(oneDayAgo) },
      }),
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.subscriptionRepository.count({
        where: { tier: 'pro' as any, status: SubscriptionStatus.ACTIVE },
      }),
      this.subscriptionRepository.count({
        where: { tier: 'team' as any, status: SubscriptionStatus.ACTIVE },
      }),
    ]);

    const mrr = await this.calculateMRR();
    const churnRate = await this.calculateChurnRate();

    return {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        activeWeek: activeUsersWeek,
        newToday: newUsersToday,
        newWeek: newUsersWeek,
        growthRate: this.calculateGrowthRate(newUsersWeek, totalUsers),
      },
      diagrams: {
        total: totalDiagrams,
        createdToday: diagramsCreatedToday,
        averagePerUser: totalUsers > 0 ? (totalDiagrams / totalUsers).toFixed(2) : 0,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        pro: proSubscriptions,
        team: teamSubscriptions,
        free: totalUsers - activeSubscriptions,
      },
      revenue: {
        mrr,
        arr: mrr * 12,
        churnRate,
      },
    };
  }

  async getRevenueChart(days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const subscriptions = await this.subscriptionRepository.find({
      where: { createdAt: MoreThan(startDate) },
      order: { createdAt: 'ASC' },
    });

    const dailyRevenue = new Map<string, number>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyRevenue.set(dateKey, 0);
    }

    subscriptions.forEach((sub) => {
      const dateKey = sub.createdAt.toISOString().split('T')[0];
      const amount = sub.tier === 'pro' ? 9 : sub.tier === 'team' ? 29 : 0;
      dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + amount);
    });

    return Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  async getUserGrowthChart(days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const users = await this.userRepository.find({
      where: { createdAt: MoreThan(startDate) },
      order: { createdAt: 'ASC' },
    });

    const dailySignups = new Map<string, number>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailySignups.set(dateKey, 0);
    }

    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      dailySignups.set(dateKey, (dailySignups.get(dateKey) || 0) + 1);
    });

    return Array.from(dailySignups.entries()).map(([date, signups]) => ({
      date,
      signups,
    }));
  }

  async getTopUsers(limit: number = 10) {
    // Get all users with their diagram counts
    const allUsers = await this.userRepository.find({
      relations: ['diagrams'],
    });

    // Sort by diagram count and take top N
    const sortedUsers = allUsers
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        diagramCount: user.diagrams?.length || 0,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => b.diagramCount - a.diagramCount)
      .slice(0, limit);

    return sortedUsers;
  }

  async getRecentSignups(limit: number = 10) {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'name', 'email', 'isGuest', 'createdAt'],
    });
  }

  async getRecentUpgrades(limit: number = 10) {
    return this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getActiveUsersChart(hours: number = 24) {
    const now = new Date();
    const intervals: Array<{ hour: string; activeUsers: number }> = [];
    
    // Generate hourly intervals
    for (let i = hours - 1; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const intervalEnd = new Date(intervalStart.getTime() + 60 * 60 * 1000);
      
      const count = await this.userRepository
        .createQueryBuilder('user')
        .where('user.lastActiveAt >= :start', { start: intervalStart })
        .andWhere('user.lastActiveAt < :end', { end: intervalEnd })
        .getCount();
      
      intervals.push({
        hour: intervalStart.toISOString(),
        activeUsers: count,
      });
    }
    
    return intervals;
  }

  async getCurrentlyActiveUsers(limit: number = 20) {
    // Consider users active if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return this.userRepository.find({
      where: {
        lastActiveAt: MoreThan(fiveMinutesAgo),
      },
      order: { lastActiveAt: 'DESC' },
      take: limit,
      select: ['id', 'name', 'email', 'isGuest', 'lastActiveAt'],
    });
  }

  async getRecentlyActiveUsers(limit: number = 20) {
    // Get users active in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return this.userRepository.find({
      where: {
        lastActiveAt: MoreThan(twentyFourHoursAgo),
      },
      order: { lastActiveAt: 'DESC' },
      take: limit,
      select: ['id', 'name', 'email', 'isGuest', 'lastActiveAt'],
    });
  }

  async listUsers(page: number = 1, limit: number = 20, search?: string, filter?: string) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    if (filter === 'admin') {
      queryBuilder.andWhere('user.isAdmin = :isAdmin', { isAdmin: true });
    } else if (filter === 'guest') {
      queryBuilder.andWhere('user.isGuest = :isGuest', { isGuest: true });
    } else if (filter === 'registered') {
      queryBuilder.andWhere('user.isGuest = :isGuest', { isGuest: false });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['diagrams', 'collaborations'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    const diagramCount = await this.diagramRepository.count({
      where: { ownerId: userId },
    });

    const collaborationCount = await this.collaboratorRepository.count({
      where: { userId },
    });

    return {
      ...user,
      subscription,
      stats: {
        diagramCount,
        collaborationCount,
      },
    };
  }

  async updateUser(userId: string, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    await this.userRepository.remove(user);
    return { success: true };
  }

  async manualSubscriptionOverride(userId: string, tier: 'free' | 'pro' | 'team') {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (tier === 'free') {
      if (subscription) {
        await this.subscriptionRepository.remove(subscription);
      }
      return { success: true, message: 'Subscription removed' };
    }

    const tierEnum = tier === 'pro' ? 'pro' : 'team';

    if (subscription) {
      subscription.tier = tierEnum as any;
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepository.save(subscription);
    } else {
      subscription = this.subscriptionRepository.create({
        userId,
        tier: tierEnum as any,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: 'manual_override',
        stripeSubscriptionId: 'manual_override',
      });
      await this.subscriptionRepository.save(subscription);
    }

    return { success: true, subscription };
  }

  async listSubscriptions(page: number = 1, limit: number = 20, filter?: string) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user');

    if (filter) {
      if (filter === 'active' || filter === 'canceled' || filter === 'past_due') {
        queryBuilder.where('subscription.status = :status', { status: filter });
      } else if (filter === 'pro' || filter === 'team') {
        queryBuilder.where('subscription.tier = :tier', { tier: filter });
      }
    }

    const [subscriptions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('subscription.createdAt', 'DESC')
      .getManyAndCount();

    return {
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubscriptionDetails(subscriptionId: string) {
    return this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    return { success: true, subscription };
  }

  async listDiagrams(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.diagramRepository
      .createQueryBuilder('diagram')
      .leftJoinAndSelect('diagram.owner', 'owner');

    if (search) {
      queryBuilder.where('LOWER(diagram.title) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    const [diagrams, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('diagram.createdAt', 'DESC')
      .getManyAndCount();

    return {
      diagrams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiagramDetails(diagramId: string) {
    const diagram = await this.diagramRepository.findOne({
      where: { id: diagramId },
      relations: ['owner', 'collaborators', 'versions'],
    });

    if (!diagram) {
      throw new Error('Diagram not found');
    }

    const latestVersion = await this.diagramVersionRepository.findOne({
      where: { diagramId },
      order: { version: 'DESC' },
    });

    return {
      ...diagram,
      latestVersion,
    };
  }

  async deleteDiagram(diagramId: string) {
    const diagram = await this.diagramRepository.findOne({
      where: { id: diagramId },
    });

    if (!diagram) {
      throw new Error('Diagram not found');
    }

    // Delete related records first to avoid foreign key constraint errors
    await this.diagramVersionRepository.delete({ diagramId });
    await this.collaboratorRepository.delete({ diagramId });
    await this.diagramRepository.remove(diagram);
    
    return { success: true };
  }

  private calculateGrowthRate(newUsers: number, totalUsers: number): string {
    if (totalUsers === 0) return '0%';
    return ((newUsers / totalUsers) * 100).toFixed(2) + '%';
  }

  private async calculateMRR(): Promise<number> {
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    return activeSubscriptions.reduce((total, sub) => {
      const amount = sub.tier === 'pro' ? 9 : sub.tier === 'team' ? 29 : 0;
      return total + amount;
    }, 0);
  }

  private async calculateChurnRate(): Promise<string> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [totalAtStart, canceled] = await Promise.all([
      this.subscriptionRepository.count({
        where: { createdAt: LessThan(oneMonthAgo) },
      }),
      this.subscriptionRepository.count({
        where: {
          status: SubscriptionStatus.CANCELED,
          updatedAt: MoreThan(oneMonthAgo),
        },
      }),
    ]);

    if (totalAtStart === 0) return '0%';
    return ((canceled / totalAtStart) * 100).toFixed(2) + '%';
  }

  async inviteUser(inviteUserDto: InviteUserDto, invitedByName: string): Promise<{ user: User; tempPassword?: string }> {
    const { email, name, sendEmail = true, tier = 'free', isAdmin = false } = inviteUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = this.userRepository.create({
      email,
      name,
      passwordHash,
      isGuest: false,
      isAdmin,
    });

    await this.userRepository.save(user);

    if (tier !== 'free') {
      const subscription = this.subscriptionRepository.create({
        userId: user.id,
        tier: tier as any,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: 'manual_override',
        stripeSubscriptionId: 'manual_override',
      });
      await this.subscriptionRepository.save(subscription);
    }

    if (sendEmail) {
      await this.emailService.sendUserInvitationEmail(
        email,
        name,
        invitedByName,
        tempPassword,
      );
    }

    return { user, tempPassword: sendEmail ? undefined : tempPassword };
  }

  async fixStaleCollaborators() {
    const diagrams = await this.diagramRepository.find();
    let fixed = 0;

    for (const diagram of diagrams) {
      const ownerCollaborator = await this.collaboratorRepository.findOne({
        where: { diagramId: diagram.id, userId: diagram.ownerId },
      });

      if (ownerCollaborator && ownerCollaborator.role !== 'owner') {
        ownerCollaborator.role = 'owner' as any;
        await this.collaboratorRepository.save(ownerCollaborator);
        fixed++;
      } else if (!ownerCollaborator) {
        const newCollaborator = this.collaboratorRepository.create({
          diagramId: diagram.id,
          userId: diagram.ownerId,
          role: 'owner' as any,
        });
        await this.collaboratorRepository.save(newCollaborator);
        fixed++;
      }
    }

    return { success: true, fixed, total: diagrams.length };
  }
}
