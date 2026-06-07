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

async function login(email = 'admin@transitops.com', password = 'admin123') {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email,
      password,
    },
  });

  return result;
}

async function loginAndGetToken() {
  const result = await login();

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

  it('requires ADMIN role for users management endpoints', async () => {
    const loginResult = await login('viewer@transitops.com', 'viewer123');
    const token = loginResult.json.data.token;

    const result = await request('/api/users', {
      token,
    });

    expect(result.status).toBe(403);
    expect(result.json.success).toBe(false);
    expect(result.json.message).toContain('ADMIN role');
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

  it('registers VIEWER users as ACTIVE and allows login', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'VIEWER',
    });
    await requestRegistrationCodes(payload);

    const registrationResult = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    expect(registrationResult.status).toBe(200);
    expect(registrationResult.json.success).toBe(true);
    expect(registrationResult.json.data?.role).toBe('VIEWER');
    expect(registrationResult.json.data?.requestedRole).toBe('VIEWER');
    expect(registrationResult.json.data?.status).toBe('ACTIVE');

    const loginResult = await login(payload.email, payload.password);

    expect(loginResult.status).toBe(200);
    expect(loginResult.json.data?.user?.role).toBe('VIEWER');
    expect(loginResult.json.data?.user?.status).toBe('ACTIVE');
  });

  it('registers OPERATOR users as pending until admin approval', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'OPERATOR',
    });
    await requestRegistrationCodes(payload);

    const registrationResult = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    expect(registrationResult.status).toBe(200);
    expect(registrationResult.json.data?.role).toBe('VIEWER');
    expect(registrationResult.json.data?.requestedRole).toBe('OPERATOR');
    expect(registrationResult.json.data?.status).toBe('PENDING_APPROVAL');

    const pendingLoginResult = await login(payload.email, payload.password);

    expect(pendingLoginResult.status).toBe(401);
    expect(pendingLoginResult.json.message).toContain('pending administrator approval');

    const adminToken = await loginAndGetToken();
    const usersResult = await request('/api/users?status=PENDING_APPROVAL&role=VIEWER', {
      token: adminToken,
    });
    const pendingUser = usersResult.json.data.find((user) => user.email === payload.email);

    expect(usersResult.status).toBe(200);
    expect(pendingUser?.requestedRole).toBe('OPERATOR');

    const approvalResult = await request(`/api/users/${pendingUser.id}/approve`, {
      method: 'PATCH',
      token: adminToken,
    });

    expect(approvalResult.status).toBe(200);
    expect(approvalResult.json.data?.role).toBe('OPERATOR');
    expect(approvalResult.json.data?.status).toBe('ACTIVE');

    const approvedLoginResult = await login(payload.email, payload.password);

    expect(approvedLoginResult.status).toBe(200);
    expect(approvedLoginResult.json.data?.user?.role).toBe('OPERATOR');
  });

  it('allows admin to reject pending SUPERVISOR users and blocks rejected login', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'SUPERVISOR',
    });
    await requestRegistrationCodes(payload);

    const registrationResult = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    expect(registrationResult.status).toBe(200);
    expect(registrationResult.json.data?.status).toBe('PENDING_APPROVAL');

    const adminToken = await loginAndGetToken();
    const usersResult = await request(`/api/users?q=${encodeURIComponent(payload.email)}`, {
      token: adminToken,
    });
    const pendingUser = usersResult.json.data.find((user) => user.email === payload.email);

    expect(pendingUser?.requestedRole).toBe('SUPERVISOR');

    const rejectionResult = await request(`/api/users/${pendingUser.id}/reject`, {
      method: 'PATCH',
      token: adminToken,
    });

    expect(rejectionResult.status).toBe(200);
    expect(rejectionResult.json.data?.status).toBe('REJECTED');

    const rejectedLoginResult = await login(payload.email, payload.password);

    expect(rejectedLoginResult.status).toBe(401);
    expect(rejectedLoginResult.json.message).toContain('rejected');
  });

  it('blocks suspended and inactive users from login and prevents admin self-deactivation', async () => {
    const payload = createRegistrationPayload({
      requestedRole: 'VIEWER',
    });
    await requestRegistrationCodes(payload);

    const registrationResult = await request('/api/auth/register', {
      method: 'POST',
      body: payload,
    });
    const userId = registrationResult.json.data.id;
    const adminToken = await loginAndGetToken();

    const suspendResult = await request(`/api/users/${userId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'SUSPENDED',
      },
    });

    expect(suspendResult.status).toBe(200);
    expect(suspendResult.json.data?.status).toBe('SUSPENDED');

    const suspendedLoginResult = await login(payload.email, payload.password);

    expect(suspendedLoginResult.status).toBe(401);
    expect(suspendedLoginResult.json.message).toContain('suspended');

    const reactivateResult = await request(`/api/users/${userId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'ACTIVE',
      },
    });

    expect(reactivateResult.status).toBe(200);
    expect(reactivateResult.json.data?.status).toBe('ACTIVE');

    const deactivateResult = await request(`/api/users/${userId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'INACTIVE',
      },
    });

    expect(deactivateResult.status).toBe(200);
    expect(deactivateResult.json.data?.status).toBe('INACTIVE');

    const inactiveLoginResult = await login(payload.email, payload.password);

    expect(inactiveLoginResult.status).toBe(401);
    expect(inactiveLoginResult.json.message).toContain('inactive');

    const selfDeactivationResult = await request('/api/users/1/status', {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'INACTIVE',
      },
    });

    expect(selfDeactivationResult.status).toBe(409);
    expect(selfDeactivationResult.json.message).toContain('own administrator account');
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
    expect(registrationResult.json.data?.role).toBe('VIEWER');
    expect(registrationResult.json.data?.status).toBe('PENDING_APPROVAL');

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
