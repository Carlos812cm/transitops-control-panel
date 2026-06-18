import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

describe('POST /api/auth/login', () => {
  it('logs in an active seeded admin user', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'admin123',
    });

    expect(response.body.data.user).toMatchObject({
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      avatarUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password.');
  });
});

describe('GET /api/auth/profile', () => {
  it('returns the authenticated user profile', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'admin123',
    });

    const token = loginResponse.body.data.token as string;

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data).toMatchObject({
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      avatarUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});
