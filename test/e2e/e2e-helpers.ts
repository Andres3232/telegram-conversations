import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function registerAndLogin(app: INestApplication): Promise<{ token: string; email: string; userId: string }> {
  const server = app.getHttpServer();

  const email = `user_${Date.now()}@example.com`;
  const password = 'password123';

  const registerRes = await request(server)
    .post('/auth/register')
    .send({ email, password })
    .expect(201);

  const loginRes = await request(server)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    token: loginRes.body.accessToken,
    email,
    userId: registerRes.body.id,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
