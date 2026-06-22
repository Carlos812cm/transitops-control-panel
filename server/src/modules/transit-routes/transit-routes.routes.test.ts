import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

async function getAdminToken(): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin@transitops.com',
    password: 'admin123',
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.success).toBe(true);
  expect(loginResponse.body.data?.token).toBeDefined();

  return loginResponse.body.data.token as string;
}

async function getViewerToken(): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'viewer@transitops.com',
    password: 'viewer123',
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.success).toBe(true);
  expect(loginResponse.body.data?.token).toBeDefined();

  return loginResponse.body.data.token as string;
}

describe('GET /api/routes', () => {
  it('returns paginated routes for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/routes?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Routes retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 2,
      }),
    );
    expect(response.body.meta.total).toBeGreaterThanOrEqual(response.body.data.length);
    expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(1);
    expect(typeof response.body.meta.hasNextPage).toBe('boolean');
    expect(response.body.meta.hasPreviousPage).toBe(false);
  });

  it('supports pageSize as pagination alias', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/routes?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(2);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  it('gives limit precedence over pageSize', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/routes?page=1&limit=1&pageSize=3')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.limit).toBe(1);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
  });

  it('keeps filters compatible with pagination', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/routes?status=ACTIVE&page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(2);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.every((route: { status: string }) => route.status === 'ACTIVE'),
    ).toBe(true);
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/routes');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('POST /api/routes', () => {
  it('creates, updates, changes status and deletes a route as admin', async () => {
    const token = await getAdminToken();
    const uniqueValue = Date.now();

    const createResponse = await request(app)
      .post('/api/routes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Route ${uniqueValue}`,
        origin: 'Test Origin',
        destination: 'Test Destination',
        distanceKm: 18.5,
        estimatedDurationMinutes: 45,
        status: 'ACTIVE',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.message).toBe('Route created successfully.');
    expect(createResponse.body.data.name).toBe(`Test Route ${uniqueValue}`);

    const routeId = createResponse.body.data.id as string;

    const updateResponse = await request(app)
      .patch(`/api/routes/${routeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Route ${uniqueValue}`,
        distanceKm: 22.75,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toBe('Route updated successfully.');
    expect(updateResponse.body.data.name).toBe(`Updated Route ${uniqueValue}`);
    expect(updateResponse.body.data.distanceKm).toBe(22.75);

    const statusResponse = await request(app)
      .patch(`/api/routes/${routeId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'INACTIVE',
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.message).toBe('Route status updated successfully.');
    expect(statusResponse.body.data.status).toBe('INACTIVE');

    const deleteResponse = await request(app)
      .delete(`/api/routes/${routeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Route deleted successfully.');
    expect(deleteResponse.body.data).toBeNull();
  });

  it('rejects non-admin users from creating routes', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .post('/api/routes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Viewer Route ${Date.now()}`,
        origin: 'Viewer Origin',
        destination: 'Viewer Destination',
        distanceKm: 10,
        estimatedDurationMinutes: 30,
        status: 'ACTIVE',
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You do not have permission to access this resource.');
  });
});
