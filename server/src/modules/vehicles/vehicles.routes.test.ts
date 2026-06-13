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

describe('GET /api/vehicles', () => {
  it('returns vehicles for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Vehicles retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/vehicles');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('POST /api/vehicles', () => {
  it('creates, updates, changes status and deletes a vehicle as admin', async () => {
    const token = await getAdminToken();
    const unitNumber = `TEST-${Date.now()}`;

    const createResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitNumber,
        brand: 'Test Brand',
        model: 'Test Model',
        year: 2026,
        capacity: 40,
        status: 'AVAILABLE',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.message).toBe('Vehicle created successfully.');
    expect(createResponse.body.data.unitNumber).toBe(unitNumber);

    const vehicleId = createResponse.body.data.id as string;

    const updateResponse = await request(app)
      .patch(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        brand: 'Updated Brand',
        capacity: 45,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toBe('Vehicle updated successfully.');
    expect(updateResponse.body.data.brand).toBe('Updated Brand');
    expect(updateResponse.body.data.capacity).toBe(45);

    const statusResponse = await request(app)
      .patch(`/api/vehicles/${vehicleId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'MAINTENANCE',
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.message).toBe('Vehicle status updated successfully.');
    expect(statusResponse.body.data.status).toBe('MAINTENANCE');

    const deleteResponse = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Vehicle deleted successfully.');
    expect(deleteResponse.body.data).toBeNull();
  });

  it('rejects duplicate unit numbers', async () => {
    const token = await getAdminToken();

    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitNumber: 'ABC-123',
        brand: 'Duplicate Brand',
        model: 'Duplicate Model',
        year: 2026,
        capacity: 30,
        status: 'AVAILABLE',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unit number is already in use.');
  });

  it('rejects non-admin users from creating vehicles', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitNumber: `VIEWER-${Date.now()}`,
        brand: 'Viewer Brand',
        model: 'Viewer Model',
        year: 2026,
        capacity: 20,
        status: 'AVAILABLE',
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You do not have permission to access this resource.');
  });
});
