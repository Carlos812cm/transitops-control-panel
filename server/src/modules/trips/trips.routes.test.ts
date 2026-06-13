import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

async function getToken(email: string, password: string): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email,
    password,
  });

  return loginResponse.body.data.token as string;
}

async function getAdminToken(): Promise<string> {
  return getToken('admin@transitops.com', 'admin123');
}

async function getOperatorToken(): Promise<string> {
  return getToken('operator@transitops.com', 'operator123');
}

async function getViewerToken(): Promise<string> {
  return getToken('viewer@transitops.com', 'viewer123');
}

async function getAvailableResources(token: string): Promise<{
  vehicleId: string;
  driverId: string;
  routeId: string;
}> {
  const vehiclesResponse = await request(app)
    .get('/api/vehicles?status=AVAILABLE')
    .set('Authorization', `Bearer ${token}`);

  const driversResponse = await request(app)
    .get('/api/drivers?status=ACTIVE')
    .set('Authorization', `Bearer ${token}`);

  const routesResponse = await request(app)
    .get('/api/routes?status=ACTIVE')
    .set('Authorization', `Bearer ${token}`);

  return {
    vehicleId: vehiclesResponse.body.data[0].id as string,
    driverId: driversResponse.body.data[0].id as string,
    routeId: routesResponse.body.data[0].id as string,
  };
}

describe('GET /api/trips', () => {
  it('returns trips for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Trips retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data[0].vehicle).toBeDefined();
    expect(response.body.data[0].driver).toBeDefined();
    expect(response.body.data[0].route).toBeDefined();
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('POST /api/trips', () => {
  it('creates, updates status and deletes a trip as admin', async () => {
    const token = await getAdminToken();
    const resources = await getAvailableResources(token);

    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...resources,
        scheduledDeparture: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        notes: 'Integration test trip',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.message).toBe('Trip created successfully.');
    expect(createResponse.body.data.status).toBe('SCHEDULED');
    expect(createResponse.body.data.vehicle).toBeDefined();
    expect(createResponse.body.data.driver).toBeDefined();
    expect(createResponse.body.data.route).toBeDefined();

    const tripId = createResponse.body.data.id as string;

    const statusResponse = await request(app)
      .patch(`/api/trips/${tripId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS',
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.message).toBe('Trip status updated successfully.');
    expect(statusResponse.body.data.status).toBe('IN_PROGRESS');

    const deleteResponse = await request(app)
      .delete(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Trip deleted successfully.');
    expect(deleteResponse.body.data).toBeNull();
  });

  it('allows operators to create trips', async () => {
    const token = await getOperatorToken();
    const resources = await getAvailableResources(token);

    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...resources,
        scheduledDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        notes: 'Operator-created test trip',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.message).toBe('Trip created successfully.');

    const adminToken = await getAdminToken();

    await request(app)
      .delete(`/api/trips/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('rejects viewers from creating trips', async () => {
    const viewerToken = await getViewerToken();
    const adminToken = await getAdminToken();
    const resources = await getAvailableResources(adminToken);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        ...resources,
        scheduledDeparture: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        notes: 'Viewer should not create this trip',
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You do not have permission to access this resource.');
  });

  it('rejects unavailable vehicles', async () => {
    const token = await getAdminToken();

    const vehiclesResponse = await request(app)
      .get('/api/vehicles?status=MAINTENANCE')
      .set('Authorization', `Bearer ${token}`);

    const driversResponse = await request(app)
      .get('/api/drivers?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    const routesResponse = await request(app)
      .get('/api/routes?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: vehiclesResponse.body.data[0].id,
        driverId: driversResponse.body.data[0].id,
        routeId: routesResponse.body.data[0].id,
        scheduledDeparture: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Vehicle is not available for trips.');
  });

  it('rejects unavailable drivers', async () => {
    const token = await getAdminToken();

    const vehiclesResponse = await request(app)
      .get('/api/vehicles?status=AVAILABLE')
      .set('Authorization', `Bearer ${token}`);

    const driversResponse = await request(app)
      .get('/api/drivers?status=SUSPENDED')
      .set('Authorization', `Bearer ${token}`);

    const routesResponse = await request(app)
      .get('/api/routes?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: vehiclesResponse.body.data[0].id,
        driverId: driversResponse.body.data[0].id,
        routeId: routesResponse.body.data[0].id,
        scheduledDeparture: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Driver is not available for trips.');
  });

  it('rejects inactive routes', async () => {
    const token = await getAdminToken();

    const vehiclesResponse = await request(app)
      .get('/api/vehicles?status=AVAILABLE')
      .set('Authorization', `Bearer ${token}`);

    const driversResponse = await request(app)
      .get('/api/drivers?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    const routesResponse = await request(app)
      .get('/api/routes?status=INACTIVE')
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: vehiclesResponse.body.data[0].id,
        driverId: driversResponse.body.data[0].id,
        routeId: routesResponse.body.data[0].id,
        scheduledDeparture: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Route is not available for trips.');
  });
});
