import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('register -> login -> me', async () => {
    const server = app.getHttpServer();

    const email = `user_${Date.now()}@example.com`;
    const password = 'password123';

    const registerRes = await request(server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(registerRes.body.email).toBe(email);
    expect(registerRes.body.id).toBeDefined();

    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();

    const meRes = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.email).toBe(email);
    expect(meRes.body.id).toBe(registerRes.body.id);
  });
});
