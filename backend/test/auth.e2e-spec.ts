import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { TestAppModule } from './test-app.module';
import { TestHelper, cleanDatabase } from './test-utils';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let helper: TestHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    helper = new TestHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.token).toBeDefined();
      expect(user.id).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      await helper.registerUser('test@example.com', 'Password123!', 'User One');

      await helper
        .getRequest()
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'User Two',
        })
        .expect(409);
    });

    it('should reject invalid email format', async () => {
      await helper
        .getRequest()
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await helper
        .getRequest()
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await helper
        .getRequest()
        .post('/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await helper.registerUser('test@example.com', 'Password123!', 'Test User');
    });

    it('should login with valid credentials', async () => {
      const user = await helper.loginUser('test@example.com', 'Password123!');

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await helper
        .getRequest()
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await helper
        .getRequest()
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('POST /auth/guest', () => {
    it('should create a guest user', async () => {
      const guest = await helper.createGuest();

      expect(guest.name).toBeDefined();
      expect(guest.token).toBeDefined();
      expect(guest.id).toBeDefined();
    });

    it('should create multiple distinct guest users', async () => {
      const guest1 = await helper.createGuest();
      const guest2 = await helper.createGuest();

      expect(guest1.id).not.toBe(guest2.id);
      expect(guest1.token).not.toBe(guest2.token);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const response = await helper
        .getRequest()
        .get('/auth/me')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
      expect(response.body.name).toBe('Test User');
      expect(response.body.id).toBe(user.id);
    });

    it('should reject request without token', async () => {
      await helper.getRequest().get('/auth/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await helper
        .getRequest()
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    it('should accept valid JWT token for protected routes', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      await helper
        .getRequest()
        .get('/diagrams')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);
    });

    it('should reject expired or malformed tokens', async () => {
      await helper
        .getRequest()
        .get('/diagrams')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);
    });
  });
});
