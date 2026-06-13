import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

async function getViewerToken(): Promise<string> {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'viewer@transitops.com',
    password: 'viewer123',
  });

  return loginResponse.body.data.token as string;
}

describe('GET /api/dashboard/summary', () => {
  it('returns dashboard summary for authenticated users', async () => {
    const token = await getViewerToken();

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Dashboard summary retrieved successfully.');

    expect(response.body.data.stats).toBeDefined();
    expect(response.body.data.stats.totalVehicles).toBeGreaterThanOrEqual(3);
    expect(response.body.data.stats.availableVehicles).toBeGreaterThanOrEqual(1);
    expect(response.body.data.stats.maintenanceVehicles).toBeGreaterThanOrEqual(1);

    expect(response.body.data.stats.totalDrivers).toBeGreaterThanOrEqual(3);
    expect(response.body.data.stats.activeDrivers).toBeGreaterThanOrEqual(1);

    expect(response.body.data.stats.totalRoutes).toBeGreaterThanOrEqual(2);
    expect(response.body.data.stats.activeRoutes).toBeGreaterThanOrEqual(1);

    expect(response.body.data.stats.totalTrips).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(response.body.data.latestTrips)).toBe(true);
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/dashboard/summary');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});
