import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const port = 4600 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
let serverProcess;

async function waitForServerReady(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error('TransitOps API did not start in time.');
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  return {
    status: response.status,
    json,
  };
}

async function loginAndGetToken() {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@transitops.com',
      password: 'admin123',
    },
  });

  expect(result.status).toBe(200);
  expect(result.json.success).toBe(true);
  expect(typeof result.json.data?.token).toBe('string');

  return result.json.data.token;
}

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(port),
    },
    stdio: 'pipe',
  });

  await waitForServerReady();
}, 20000);

afterAll(async () => {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  serverProcess.kill('SIGTERM');
  await once(serverProcess, 'exit').catch(() => undefined);
});

describe('TransitOps API hardening rules', () => {
  it('rejects protected endpoints without authorization', async () => {
    const result = await request('/api/vehicles');

    expect(result.status).toBe(401);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('authorization token');
  });

  it('blocks trip creation when vehicle is not AVAILABLE', async () => {
    const token = await loginAndGetToken();

    const result = await request('/api/trips', {
      method: 'POST',
      token,
      body: {
        vehicleId: 'veh-2',
        driverId: 'drv-1',
        routeId: 'rte-1',
        scheduledDeparture: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        notes: 'Test trip',
      },
    });

    expect(result.status).toBe(409);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('Vehicle must be AVAILABLE');
  });

  it('rejects invalid trip status transitions', async () => {
    const token = await loginAndGetToken();

    const result = await request('/api/trips/trp-2/status', {
      method: 'PATCH',
      token,
      body: {
        status: 'SCHEDULED',
      },
    });

    expect(result.status).toBe(409);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('Cannot change trip status');
  });

  it('rejects empty vehicle update payloads', async () => {
    const token = await loginAndGetToken();

    const result = await request('/api/vehicles/veh-1', {
      method: 'PATCH',
      token,
      body: {},
    });

    expect(result.status).toBe(400);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('No valid fields were provided for update.');
  });
});
