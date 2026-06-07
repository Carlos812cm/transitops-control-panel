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

function createRegistrationPayload(overrides = {}) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    firstName: 'Casey',
    lastName: 'Rivera',
    phone: `+1 555 ${String(Math.floor(Math.random() * 900) + 100)} ${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`,
    phoneCode: '654321',
    email: `casey.rivera.${unique}@example.com`,
    emailCode: '123456',
    password: 'register123',
    confirmPassword: 'register123',
    requestedRole: 'VIEWER',
    ...overrides,
  };
}

async function requestRegistrationCodes(payload) {
  const emailCodeResult = await request('/api/auth/request-email-code', {
    method: 'POST',
    body: {
      email: payload.email,
    },
  });

  const phoneCodeResult = await request('/api/auth/request-phone-code', {
    method: 'POST',
    body: {
      phone: payload.phone,
    },
  });

  expect(emailCodeResult.status).toBe(200);
  expect(phoneCodeResult.status).toBe(200);

  return {
    emailCodeResult,
    phoneCodeResult,
  };
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

  it('generates public mock registration codes', async () => {
    const payload = createRegistrationPayload();
    const { emailCodeResult, phoneCodeResult } = await requestRegistrationCodes(payload);

    expect(emailCodeResult.json.success).toBe(true);
    expect(emailCodeResult.json.data?.code).toBe('123456');
    expect(emailCodeResult.json.message).toContain('development only');
    expect(phoneCodeResult.json.success).toBe(true);
    expect(phoneCodeResult.json.data?.code).toBe('654321');
    expect(phoneCodeResult.json.message).toContain('development only');
  });

  it('rejects invalid email and phone registration codes', async () => {
    const emailPayload = createRegistrationPayload({
      emailCode: '000000',
    });
    await requestRegistrationCodes(emailPayload);

    const invalidEmailCodeResult = await request('/api/auth/register', {
      method: 'POST',
      body: emailPayload,
    });

    expect(invalidEmailCodeResult.status).toBe(400);
    expect(invalidEmailCodeResult.json.success).toBe(false);
    expect(invalidEmailCodeResult.json.message).toContain('Email verification code is invalid');

    const phonePayload = createRegistrationPayload({
      phoneCode: '000000',
    });
    await requestRegistrationCodes(phonePayload);

    const invalidPhoneCodeResult = await request('/api/auth/register', {
      method: 'POST',
      body: phonePayload,
    });

    expect(invalidPhoneCodeResult.status).toBe(400);
    expect(invalidPhoneCodeResult.json.success).toBe(false);
    expect(invalidPhoneCodeResult.json.message).toContain('Phone verification code is invalid');
  });

  it('rejects ADMIN role from public registration', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'ADMIN',
    });
    await requestRegistrationCodes(payload);

    const result = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    expect(result.status).toBe(400);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('ADMIN cannot be requested');
  });

  it('registers a user after valid codes and rejects duplicate email or phone', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'OPERATOR',
    });
    await requestRegistrationCodes(payload);

    const registrationResult = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    expect(registrationResult.status).toBe(200);
    expect(registrationResult.json.success).toBe(true);
    expect(registrationResult.json.data?.email).toBe(payload.email);
    expect(registrationResult.json.data?.phone).toBe(payload.phone);
    expect(registrationResult.json.data?.requestedRole).toBe('OPERATOR');

    const duplicateEmailResult = await request('/api/auth/request-email-code', {
      method: 'POST',
      body: {
        email: payload.email,
      },
    });

    expect(duplicateEmailResult.status).toBe(409);
    expect(duplicateEmailResult.json.message).toContain('Email is already registered');

    const duplicatePhoneResult = await request('/api/auth/request-phone-code', {
      method: 'POST',
      body: {
        phone: payload.phone,
      },
    });

    expect(duplicatePhoneResult.status).toBe(409);
    expect(duplicatePhoneResult.json.message).toContain('Phone is already registered');
  });
});
