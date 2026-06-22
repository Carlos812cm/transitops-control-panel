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

describe('GET /api/drivers', () => {
  it('returns paginated drivers for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/drivers?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Drivers retrieved successfully.');
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
      .get('/api/drivers?page=1&pageSize=2')
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
      .get('/api/drivers?page=1&limit=1&pageSize=3')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.limit).toBe(1);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
  });

  it('keeps filters compatible with pagination', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/drivers?status=ACTIVE&page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(2);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.every((driver: { status: string }) => driver.status === 'ACTIVE'),
    ).toBe(true);
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/drivers');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('POST /api/drivers', () => {
  it('creates, updates, changes status and deletes a driver as admin', async () => {
    const token = await getAdminToken();
    const uniqueValue = Date.now();

    const createResponse = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Test',
        lastName: 'Driver',
        licenseNumber: `TEST-LIC-${uniqueValue}`,
        phone: `555-${uniqueValue}`,
        email: `driver-${uniqueValue}@transitops.test`,
        status: 'ACTIVE',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.message).toBe('Driver created successfully.');
    expect(createResponse.body.data.licenseNumber).toBe(`TEST-LIC-${uniqueValue}`);

    const driverId = createResponse.body.data.id as string;

    const updateResponse = await request(app)
      .patch(`/api/drivers/${driverId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated',
        phone: `556-${uniqueValue}`,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toBe('Driver updated successfully.');
    expect(updateResponse.body.data.firstName).toBe('Updated');
    expect(updateResponse.body.data.phone).toBe(`556-${uniqueValue}`);

    const statusResponse = await request(app)
      .patch(`/api/drivers/${driverId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'SUSPENDED',
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.message).toBe('Driver status updated successfully.');
    expect(statusResponse.body.data.status).toBe('SUSPENDED');

    const deleteResponse = await request(app)
      .delete(`/api/drivers/${driverId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Driver deleted successfully.');
    expect(deleteResponse.body.data).toBeNull();
  });

  it('rejects duplicate license numbers', async () => {
    const token = await getAdminToken();
    const uniqueValue = Date.now();
    const licenseNumber = `DUP-LIC-${uniqueValue}`;

    const createResponse = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Original',
        lastName: 'Driver',
        licenseNumber,
        phone: `557-${uniqueValue}`,
        email: `original-driver-${uniqueValue}@transitops.test`,
        status: 'ACTIVE',
      });

    expect(createResponse.status).toBe(201);

    const driverId = createResponse.body.data.id as string;

    const duplicateResponse = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Driver',
        licenseNumber,
        phone: `558-${uniqueValue}`,
        email: `duplicate-driver-${uniqueValue}@transitops.test`,
        status: 'ACTIVE',
      });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.message).toBe('License number is already in use.');

    await request(app).delete(`/api/drivers/${driverId}`).set('Authorization', `Bearer ${token}`);
  });

  it('rejects non-admin users from creating drivers', async () => {
    const token = await getViewerToken();
    const uniqueValue = Date.now();

    const response = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Viewer',
        lastName: 'Driver',
        licenseNumber: `VIEWER-LIC-${uniqueValue}`,
        phone: `559-${uniqueValue}`,
        email: `viewer-driver-${uniqueValue}@transitops.test`,
        status: 'ACTIVE',
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You do not have permission to access this resource.');
  });
});
