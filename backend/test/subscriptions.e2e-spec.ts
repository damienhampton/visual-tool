import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { TestHelper, cleanDatabase } from './test-utils';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionTier, SubscriptionStatus } from '../src/entities/subscription.entity';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let helper: TestHelper;
  let subscriptionRepository: Repository<Subscription>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    
    helper = new TestHelper(app);
    subscriptionRepository = moduleFixture.get(getRepositoryToken(Subscription));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('GET /subscriptions/me', () => {
    it('should get user subscription (defaults to free)', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        userId: user.id,
        tier: 'free',
        status: 'active',
      });
    });

    it('should require authentication', async () => {
      await helper.getRequest()
        .get('/subscriptions/me')
        .expect(401);
    });
  });

  describe('GET /subscriptions/usage', () => {
    it('should return usage stats for free tier', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        tier: 'free',
        status: 'active',
        diagramCount: 0,
        diagramLimit: 3,
      });
    });

    it('should show correct diagram count', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.diagramCount).toBe(2);
      expect(response.body.diagramLimit).toBe(3);
    });

    it('should show unlimited for pro tier', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Manually set subscription to pro
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        await subscriptionRepository.save(subscription);
      }
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        tier: 'pro',
        diagramLimit: -1,
      });
    });
  });

  describe('Diagram Limits', () => {
    it('should allow creating diagrams within free tier limit', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      await helper.createDiagram(user.token, 'Diagram 3');
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.diagramCount).toBe(3);
    });

    it('should enforce free tier diagram limit', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      await helper.createDiagram(user.token, 'Diagram 3');
      
      const response = await helper.getRequest()
        .post('/diagrams')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ name: 'Diagram 4' })
        .expect(403);

      expect(response.body.message).toContain('limit');
    });

    it('should allow unlimited diagrams for pro tier', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Upgrade to pro
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        await subscriptionRepository.save(subscription);
      }
      
      // Create more than free tier limit
      for (let i = 1; i <= 5; i++) {
        await helper.createDiagram(user.token, `Diagram ${i}`);
      }
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.diagramCount).toBe(5);
    });

    it('should treat canceled subscription as free tier', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Set up pro subscription but canceled
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        subscription.status = SubscriptionStatus.CANCELED;
        await subscriptionRepository.save(subscription);
      }
      
      // Create 3 diagrams
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      await helper.createDiagram(user.token, 'Diagram 3');
      
      // Should not allow 4th diagram
      await helper.getRequest()
        .post('/diagrams')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ name: 'Diagram 4' })
        .expect(403);
    });

    it('should treat past_due subscription as free tier', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Set up pro subscription but past due
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        subscription.status = SubscriptionStatus.PAST_DUE;
        await subscriptionRepository.save(subscription);
      }
      
      // Create 3 diagrams
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      await helper.createDiagram(user.token, 'Diagram 3');
      
      // Should not allow 4th diagram
      await helper.getRequest()
        .post('/diagrams')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ name: 'Diagram 4' })
        .expect(403);
    });
  });

  describe('Subscription Tiers', () => {
    it('should support team tier with unlimited diagrams', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Upgrade to team
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.TEAM;
        subscription.status = SubscriptionStatus.ACTIVE;
        await subscriptionRepository.save(subscription);
      }
      
      // Create multiple diagrams
      for (let i = 1; i <= 10; i++) {
        await helper.createDiagram(user.token, `Diagram ${i}`);
      }
      
      const response = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.diagramCount).toBe(10);
      expect(response.body.tier).toBe('team');
      expect(response.body.diagramLimit).toBe(-1);
    });
  });

  describe('Subscription Metadata', () => {
    it('should have default subscription fields', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(user.id);
      expect(response.body.tier).toBe('free');
      expect(response.body.status).toBe('active');
    });
  });

  describe('Multiple Users', () => {
    it('should enforce limits independently per user', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      
      // User1 creates 3 diagrams (at limit)
      await helper.createDiagram(user1.token, 'U1 Diagram 1');
      await helper.createDiagram(user1.token, 'U1 Diagram 2');
      await helper.createDiagram(user1.token, 'U1 Diagram 3');
      
      // User2 should still be able to create diagrams
      await helper.createDiagram(user2.token, 'U2 Diagram 1');
      await helper.createDiagram(user2.token, 'U2 Diagram 2');
      
      const usage1 = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);
      expect(usage1.body.diagramCount).toBe(3);
      
      const usage2 = await helper.getRequest()
        .get('/subscriptions/usage')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);
      expect(usage2.body.diagramCount).toBe(2);
    });
  });
});
