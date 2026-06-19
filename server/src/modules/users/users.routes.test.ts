import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

async function getAdminToken(): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin@transitops.com',
    password: 'admin123',
  });

  return loginResponse.body.data.token as string;
}

async function getViewerToken(): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'viewer@transitops.com',
    password: 'viewer123',
  });

  return loginResponse.body.data.token as string;
}

describe('GET /api/users', () => {
  it('returns users for admin users', async () => {
    const token = await getAdminToken();

    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Users retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(4);

    const admin = response.body.data.find(
      (user: { email: string }) => user.email === 'admin@transitops.com',
    );

    expect(admin).toMatchObject({
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      avatarUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(admin.passwordHash).toBeUndefined();
  });

  it('rejects users without token', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });

  it('rejects non-admin users', async () => {
    const token = await getViewerToken();

    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You do not have permission to access this resource.');
  });
});

describe('PATCH /api/users/:id/status', () => {
  it('updates a non-admin user status', async () => {
    const token = await getAdminToken();

    const usersResponse = await request(app)
      .get('/api/users?role=VIEWER')
      .set('Authorization', `Bearer ${token}`);

    const viewer = usersResponse.body.data.find(
      (user: { email: string }) => user.email === 'viewer@transitops.com',
    );

    const response = await request(app)
      .patch(`/api/users/${viewer.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'INACTIVE',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User status updated successfully.');
    expect(response.body.data.email).toBe('viewer@transitops.com');
    expect(response.body.data.status).toBe('INACTIVE');
    expect(response.body.data.passwordHash).toBeUndefined();

    await request(app)
      .patch(`/api/users/${viewer.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'ACTIVE',
      });
  });
});
