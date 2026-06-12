import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

describe('POST /api/auth/login', () => {
  it('logs in an active seeded admin user', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'admin123',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful.');
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe('admin@transitops.com');
    expect(response.body.data.user.role).toBe('ADMIN');
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

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Profile retrieved successfully.');
    expect(response.body.data.email).toBe('admin@transitops.com');
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});
