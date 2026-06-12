import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';

describe('GET /api/unknown', () => {
  it('returns a standard not found response', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Endpoint not found: GET /api/unknown');
  });
});
