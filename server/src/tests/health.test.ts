import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../app.js';

describe('GET /api/health', () => {
  it('returns the real API health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('TransitOps real API is running.');
    expect(response.body.data.service).toBe('transitops-api');
    expect(response.body.data.environment).toBeDefined();
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
  });
});
