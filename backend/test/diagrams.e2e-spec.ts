import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { TestAppModule } from './test-app.module';
import { TestHelper, cleanDatabase } from './test-utils';

describe('Diagrams (e2e)', () => {
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

  describe('POST /diagrams', () => {
    it('should create a new diagram', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const diagram = await helper.createDiagram(user.token, 'My First Diagram');

      expect(diagram.title).toBe('My First Diagram');
      expect(diagram.ownerId).toBe(user.id);
      expect(diagram.shareToken).toBeDefined();
      expect(diagram.id).toBeDefined();
    });

    it('should reject diagram creation without authentication', async () => {
      await helper
        .getRequest()
        .post('/diagrams')
        .send({ title: 'Unauthorized Diagram' })
        .expect(401);
    });

    it('should reject diagram creation without title', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      await helper
        .getRequest()
        .post('/diagrams')
        .set('Authorization', `Bearer ${user.token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /diagrams', () => {
    it('should list user diagrams', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      await helper.createDiagram(user.token, 'Diagram 1');
      await helper.createDiagram(user.token, 'Diagram 2');
      await helper.createDiagram(user.token, 'Diagram 3');

      const diagrams = await helper.listDiagrams(user.token);

      expect(diagrams).toHaveLength(3);
      expect(diagrams.map((d: any) => d.title)).toContain('Diagram 1');
      expect(diagrams.map((d: any) => d.title)).toContain('Diagram 2');
      expect(diagrams.map((d: any) => d.title)).toContain('Diagram 3');
    });

    it('should only return diagrams owned by the user', async () => {
      const user1 = await helper.registerUser(
        'user1@example.com',
        'Password123!',
        'User 1'
      );
      const user2 = await helper.registerUser(
        'user2@example.com',
        'Password123!',
        'User 2'
      );

      await helper.createDiagram(user1.token, 'User 1 Diagram');
      await helper.createDiagram(user2.token, 'User 2 Diagram');

      const user1Diagrams = await helper.listDiagrams(user1.token);
      const user2Diagrams = await helper.listDiagrams(user2.token);

      expect(user1Diagrams).toHaveLength(1);
      expect(user1Diagrams[0].title).toBe('User 1 Diagram');

      expect(user2Diagrams).toHaveLength(1);
      expect(user2Diagrams[0].title).toBe('User 2 Diagram');
    });

    it('should return empty array for user with no diagrams', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const diagrams = await helper.listDiagrams(user.token);

      expect(diagrams).toHaveLength(0);
    });
  });

  describe('GET /diagrams/:id', () => {
    it('should get diagram by id', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const created = await helper.createDiagram(user.token, 'Test Diagram');
      const diagram = await helper.getDiagram(user.token, created.id);

      expect(diagram.id).toBe(created.id);
      expect(diagram.title).toBe('Test Diagram');
      expect(diagram.ownerId).toBe(user.id);
    });

    it('should reject access to other users diagrams', async () => {
      const user1 = await helper.registerUser(
        'user1@example.com',
        'Password123!',
        'User 1'
      );
      const user2 = await helper.registerUser(
        'user2@example.com',
        'Password123!',
        'User 2'
      );

      const diagram = await helper.createDiagram(user1.token, 'Private Diagram');

      await helper
        .getRequest()
        .get(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(403);
    });

    it('should return 404 for non-existent diagram', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      await helper
        .getRequest()
        .get('/diagrams/non-existent-id')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });
  });

  describe('PUT /diagrams/:id', () => {
    it('should update diagram title', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const diagram = await helper.createDiagram(user.token, 'Original Title');

      await helper.updateDiagram(user.token, diagram.id, {
        title: 'Updated Title',
      });

      const updated = await helper.getDiagram(user.token, diagram.id);
      expect(updated.title).toBe('Updated Title');
    });

    it('should update diagram data', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const diagram = await helper.createDiagram(user.token, 'Test Diagram');

      const diagramData = {
        nodes: [
          {
            id: 'node-1',
            type: 'c4Node',
            position: { x: 100, y: 100 },
            data: { label: 'User', type: 'person' },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      await helper.updateDiagram(user.token, diagram.id, { data: diagramData });

      const updated = await helper.getDiagram(user.token, diagram.id);
      expect(updated.currentVersion?.data).toEqual(diagramData);
    });

    it('should reject update by non-owner', async () => {
      const user1 = await helper.registerUser(
        'user1@example.com',
        'Password123!',
        'User 1'
      );
      const user2 = await helper.registerUser(
        'user2@example.com',
        'Password123!',
        'User 2'
      );

      const diagram = await helper.createDiagram(user1.token, 'User 1 Diagram');

      await helper
        .getRequest()
        .put(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /diagrams/:id', () => {
    it('should delete diagram', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      const diagram = await helper.createDiagram(user.token, 'To Be Deleted');

      await helper.deleteDiagram(user.token, diagram.id);

      await helper
        .getRequest()
        .get(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });

    it('should reject deletion by non-owner', async () => {
      const user1 = await helper.registerUser(
        'user1@example.com',
        'Password123!',
        'User 1'
      );
      const user2 = await helper.registerUser(
        'user2@example.com',
        'Password123!',
        'User 2'
      );

      const diagram = await helper.createDiagram(user1.token, 'Protected Diagram');

      await helper
        .getRequest()
        .delete(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(403);
    });

    it('should return 404 when deleting non-existent diagram', async () => {
      const user = await helper.registerUser(
        'test@example.com',
        'Password123!',
        'Test User'
      );

      await helper
        .getRequest()
        .delete('/diagrams/non-existent-id')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });
  });

  describe('Collaboration and Permissions', () => {
    it('should allow adding collaborators', async () => {
      const owner = await helper.registerUser(
        'owner@example.com',
        'Password123!',
        'Owner'
      );
      const collaborator = await helper.registerUser(
        'collab@example.com',
        'Password123!',
        'Collaborator'
      );

      const diagram = await helper.createDiagram(owner.token, 'Shared Diagram');

      await helper.addCollaborator(
        owner.token,
        diagram.id,
        collaborator.id,
        'editor'
      );

      const diagramData = await helper.getDiagram(collaborator.token, diagram.id);
      expect(diagramData.id).toBe(diagram.id);
    });

    it('should enforce collaborator permissions', async () => {
      const owner = await helper.registerUser(
        'owner@example.com',
        'Password123!',
        'Owner'
      );
      const viewer = await helper.registerUser(
        'viewer@example.com',
        'Password123!',
        'Viewer'
      );

      const diagram = await helper.createDiagram(owner.token, 'Shared Diagram');

      await helper.addCollaborator(owner.token, diagram.id, viewer.id, 'viewer');

      await helper
        .getRequest()
        .put(`/diagrams/${diagram.id}`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({ title: 'Attempted Edit' })
        .expect(403);
    });
  });

  describe('Share Token Access', () => {
    it('should allow access via share token', async () => {
      const owner = await helper.registerUser(
        'owner@example.com',
        'Password123!',
        'Owner'
      );

      const diagram = await helper.createDiagram(owner.token, 'Shared Diagram');

      const response = await helper
        .getRequest()
        .get(`/diagrams/shared/${diagram.shareToken}`)
        .expect(200);

      expect(response.body.id).toBe(diagram.id);
      expect(response.body.title).toBe('Shared Diagram');
    });

    it('should reject invalid share token', async () => {
      await helper
        .getRequest()
        .get('/diagrams/shared/invalid-token')
        .expect(404);
    });
  });
});
