import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface TestDiagram {
  id: string;
  title: string;
  ownerId: string;
  shareToken: string;
}

export class TestHelper {
  constructor(private app: INestApplication<App>) {}

  async registerUser(email: string, password: string, name: string): Promise<TestUser> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name })
      .expect(201);

    return {
      id: response.body.user.id,
      email: response.body.user.email,
      name: response.body.user.name,
      token: response.body.accessToken,
    };
  }

  async loginUser(email: string, password: string): Promise<TestUser> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return {
      id: response.body.user.id,
      email: response.body.user.email,
      name: response.body.user.name,
      token: response.body.accessToken,
    };
  }

  async createGuest(): Promise<TestUser> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/guest')
      .send({ name: 'Guest User' })
      .expect(201);

    return {
      id: response.body.user.id,
      email: response.body.user.email,
      name: response.body.user.name,
      token: response.body.accessToken,
    };
  }

  async createDiagram(token: string, title: string): Promise<TestDiagram> {
    const response = await request(this.app.getHttpServer())
      .post('/diagrams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title })
      .expect(201);

    return {
      id: response.body.id,
      title: response.body.title,
      ownerId: response.body.ownerId,
      shareToken: response.body.shareToken,
    };
  }

  async updateDiagram(token: string, diagramId: string, data: any): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/diagrams/${diagramId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(200);
  }

  async getDiagram(token: string, diagramId: string) {
    const response = await request(this.app.getHttpServer())
      .get(`/diagrams/${diagramId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body;
  }

  async listDiagrams(token: string) {
    const response = await request(this.app.getHttpServer())
      .get('/diagrams')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body;
  }

  async deleteDiagram(token: string, diagramId: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/diagrams/${diagramId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  }

  async addCollaborator(token: string, diagramId: string, userId: string, role: string) {
    const response = await request(this.app.getHttpServer())
      .post(`/diagrams/${diagramId}/collaborators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, role })
      .expect(201);

    return response.body;
  }

  getRequest() {
    return request(this.app.getHttpServer());
  }
}

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  
  // Disable foreign key checks for SQLite
  await dataSource.query('PRAGMA foreign_keys = OFF;');
  
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
  
  // Re-enable foreign key checks
  await dataSource.query('PRAGMA foreign_keys = ON;');
}
