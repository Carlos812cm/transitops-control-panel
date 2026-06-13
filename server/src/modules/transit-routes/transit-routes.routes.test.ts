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

describe('GET /api/routes', () => {
  it('returns routes for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/routes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Routes retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
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
