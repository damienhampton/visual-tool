import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { TestHelper, cleanDatabase } from './test-utils';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Subscription, SubscriptionTier, SubscriptionStatus } from '../src/entities/subscription.entity';
import { AuditLog } from '../src/entities/audit-log.entity';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let helper: TestHelper;
  let userRepository: Repository<User>;
  let subscriptionRepository: Repository<Subscription>;
  let auditLogRepository: Repository<AuditLog>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    
    helper = new TestHelper(app);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    subscriptionRepository = moduleFixture.get(getRepositoryToken(Subscription));
    auditLogRepository = moduleFixture.get(getRepositoryToken(AuditLog));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  async function createAdminUser() {
    const admin = await helper.registerUser('admin@example.com', 'Admin123!', 'Admin User');
    const user = await userRepository.findOne({ where: { id: admin.id } });
    if (user) {
      user.isAdmin = true;
      await userRepository.save(user);
    }
    return admin;
  }

  describe('Admin Access Control', () => {
    it('should deny access to non-admin users', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Regular User');
      
      await helper.getRequest()
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(403);
    });

    it('should deny access without authentication', async () => {
      await helper.getRequest()
        .get('/admin/dashboard/stats')
        .expect(401);
    });

    it('should allow access to admin users', async () => {
      const admin = await createAdminUser();
      
      await helper.getRequest()
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
    });
  });

  describe('Dashboard Statistics', () => {
    it('should return dashboard stats', async () => {
      const admin = await createAdminUser();
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalDiagrams');
      expect(response.body).toHaveProperty('activeSubscriptions');
      expect(response.body).toHaveProperty('totalRevenue');
    });

    it('should count users correctly', async () => {
      const admin = await createAdminUser();
      await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.totalUsers).toBeGreaterThanOrEqual(3);
    });

    it('should count diagrams correctly', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.totalDiagrams).toBeGreaterThanOrEqual(2);
    });
  });

  describe('User Management', () => {
    it('should list all users', async () => {
      const admin = await createAdminUser();
      await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      
      const response = await helper.getRequest()
        .get('/admin/users')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(3);
      expect(response.body.page).toBe(1);
    });

    it('should support pagination', async () => {
      const admin = await createAdminUser();
      
      const response = await helper.getRequest()
        .get('/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.limit).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBeDefined();
    });

    it('should search users by email', async () => {
      const admin = await createAdminUser();
      await helper.registerUser('john@example.com', 'Password123!', 'John Doe');
      await helper.registerUser('jane@example.com', 'Password123!', 'Jane Doe');
      
      const response = await helper.getRequest()
        .get('/admin/users?search=john')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users.some((u: any) => u.email.includes('john'))).toBe(true);
    });

    it('should get user details', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .get(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe('user@example.com');
      expect(response.body.name).toBe('Test User');
    });

    it('should update user details', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated Name', email: 'updated@example.com' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('updated@example.com');
    });

    it('should make user an admin', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ isAdmin: true })
        .expect(200);

      const updatedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(updatedUser?.isAdmin).toBe(true);
    });

    it('should delete user', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .delete(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      const deletedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Subscription Management', () => {
    it('should list all subscriptions', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .get('/admin/subscriptions')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.subscriptions).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter subscriptions by tier', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Upgrade user to pro
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        await subscriptionRepository.save(subscription);
      }
      
      const response = await helper.getRequest()
        .get('/admin/subscriptions?filter=pro')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.subscriptions.length).toBeGreaterThan(0);
      expect(response.body.subscriptions.every((s: any) => s.tier === 'pro')).toBe(true);
    });

    it('should filter subscriptions by status', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.status = SubscriptionStatus.CANCELED;
        await subscriptionRepository.save(subscription);
      }
      
      const response = await helper.getRequest()
        .get('/admin/subscriptions?filter=canceled')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.subscriptions.length).toBeGreaterThan(0);
      expect(response.body.subscriptions.every((s: any) => s.status === 'canceled')).toBe(true);
    });

    it('should get subscription details', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      
      const response = await helper.getRequest()
        .get(`/admin/subscriptions/${subscription?.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.id).toBe(subscription?.id);
      expect(response.body.userId).toBe(user.id);
    });

    it('should manually override subscription to pro', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .post(`/admin/users/${user.id}/subscription-override`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ tier: 'pro' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.tier).toBe('pro');
      expect(response.body.subscription.status).toBe('active');
    });

    it('should manually override subscription to team', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const response = await helper.getRequest()
        .post(`/admin/users/${user.id}/subscription-override`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ tier: 'team' })
        .expect(201);

      expect(response.body.subscription.tier).toBe('team');
    });

    it('should remove subscription with free tier override', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // First set to pro
      await helper.getRequest()
        .post(`/admin/users/${user.id}/subscription-override`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ tier: 'pro' })
        .expect(201);
      
      // Then revert to free
      const response = await helper.getRequest()
        .post(`/admin/users/${user.id}/subscription-override`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ tier: 'free' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should cancel subscription', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      
      const response = await helper.getRequest()
        .post(`/admin/subscriptions/${subscription?.id}/cancel`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.status).toBe('canceled');
    });
  });

  describe('Diagram Management', () => {
    it('should list all diagrams', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Test Diagram');
      
      const response = await helper.getRequest()
        .get('/admin/diagrams')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.diagrams).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should search diagrams by name', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Architecture Diagram');
      await helper.createDiagram(user.token, 'Database Schema');
      
      const response = await helper.getRequest()
        .get('/admin/diagrams?search=Architecture')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.diagrams.length).toBeGreaterThan(0);
      expect(response.body.diagrams.some((d: any) => d.name.includes('Architecture'))).toBe(true);
    });

    it('should get diagram details', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      const response = await helper.getRequest()
        .get(`/admin/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.id).toBe(diagram.id);
      expect(response.body.name).toBe('Test Diagram');
    });

    it('should delete diagram', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      await helper.getRequest()
        .delete(`/admin/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      // Verify diagram is deleted
      await helper.getRequest()
        .get(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });
  });

  describe('Audit Logs', () => {
    it('should create audit log when updating user', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const logs = await auditLogRepository.find({ where: { adminId: admin.id } });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('UPDATE_USER');
      expect(logs[0].targetType).toBe('user');
      expect(logs[0].targetId).toBe(user.id);
    });

    it('should create audit log when deleting user', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .delete(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      const logs = await auditLogRepository.find({ 
        where: { adminId: admin.id, action: 'DELETE_USER' } 
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should create audit log when overriding subscription', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .post(`/admin/users/${user.id}/subscription-override`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ tier: 'pro' })
        .expect(201);

      const logs = await auditLogRepository.find({ 
        where: { adminId: admin.id, action: 'SUBSCRIPTION_OVERRIDE' } 
      });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata).toMatchObject({ tier: 'pro' });
    });

    it('should create audit log when canceling subscription', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      
      await helper.getRequest()
        .post(`/admin/subscriptions/${subscription?.id}/cancel`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(201);

      const logs = await auditLogRepository.find({ 
        where: { adminId: admin.id, action: 'CANCEL_SUBSCRIPTION' } 
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should create audit log when deleting diagram', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      await helper.getRequest()
        .delete(`/admin/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      const logs = await auditLogRepository.find({ 
        where: { adminId: admin.id, action: 'DELETE_DIAGRAM' } 
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should retrieve audit logs', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Perform some actions
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated' })
        .expect(200);

      const response = await helper.getRequest()
        .get('/admin/audit-logs')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.logs).toBeDefined();
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter audit logs by admin', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated' })
        .expect(200);

      const response = await helper.getRequest()
        .get(`/admin/audit-logs?adminId=${admin.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.logs.every((log: any) => log.adminId === admin.id)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated' })
        .expect(200);

      const response = await helper.getRequest()
        .get('/admin/audit-logs?action=UPDATE_USER')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.logs.every((log: any) => log.action === 'UPDATE_USER')).toBe(true);
    });

    it('should filter audit logs by target type', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.getRequest()
        .put(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated' })
        .expect(200);

      const response = await helper.getRequest()
        .get('/admin/audit-logs?targetType=user')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.logs.every((log: any) => log.targetType === 'user')).toBe(true);
    });
  });

  describe('Recent Activity', () => {
    it('should get recent signups', async () => {
      const admin = await createAdminUser();
      await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/recent-signups?limit=5')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get recent upgrades', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      // Upgrade user
      const subscription = await subscriptionRepository.findOne({ where: { userId: user.id } });
      if (subscription) {
        subscription.tier = SubscriptionTier.PRO;
        await subscriptionRepository.save(subscription);
      }
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/recent-upgrades?limit=5')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get top users by diagram count', async () => {
      const admin = await createAdminUser();
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      
      const response = await helper.getRequest()
        .get('/admin/dashboard/top-users?limit=10')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
