import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { authHeader, registerAndLogin } from './e2e-helpers';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // The app boots background services (Kafka/polling), so give e2e a bit more time.
  jest.setTimeout(30_000);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('health endpoints', async () => {
    const server = app.getHttpServer();

  await request(server).get('/health/liveness').expect(200);
  await request(server).get('/health/readiness').expect(200);
  });

  it('auth: login with wrong password returns 400', async () => {
    const server = app.getHttpServer();

    const email = `user_${Date.now()}@example.com`;
    const password = 'password123';

    await request(server).post('/auth/register').send({ email, password }).expect(201);

    await request(server)
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(400);
  });

  it('register -> login -> me', async () => {
    const server = app.getHttpServer();

    const { token, email, userId } = await registerAndLogin(app);

    const meRes = await request(server)
      .get('/auth/me')
      .set(authHeader(token))
      .expect(200);

    expect(meRes.body.email).toBe(email);
    expect(meRes.body.id).toBe(userId);
  });

  it('conversations endpoints require auth', async () => {
    const server = app.getHttpServer();

    await request(server).get('/conversations').expect(401);
  });

  it('conversations list returns pagination shape (empty ok)', async () => {
    const server = app.getHttpServer();
    const { token } = await registerAndLogin(app);

    const res = await request(server)
      .get('/conversations?limit=5&offset=0')
      .set(authHeader(token))
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('offset');
  });

  it('send message: invalid conversation id returns 400 (domain error)', async () => {
    const server = app.getHttpServer();
    const { token } = await registerAndLogin(app);

    await request(server)
      .post('/conversations/not-a-uuid/messages')
      .set(authHeader(token))
      .send({ text: 'hola' })
      .expect(400);
  });
});
