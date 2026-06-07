const express = require('express');
const crypto = require('node:crypto');

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.header('Origin');
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

  if (origin && isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return isAllowedOrigin ? res.sendStatus(204) : res.sendStatus(403);
  }

  if (!isAllowedOrigin) {
    return fail(res, 403, 'Origin not allowed.');
  }

  next();
});

const demoUsers = [
  {
    id: 1,
    name: 'Admin Demo',
    email: 'admin@transitops.com',
    phone: '+1 555 010 1000',
    password: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Operator Demo',
    email: 'operator@transitops.com',
    phone: '+1 555 010 1001',
    password: 'operator123',
    role: 'OPERATOR',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Supervisor Demo',
    email: 'supervisor@transitops.com',
    phone: '+1 555 010 1002',
    password: 'supervisor123',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
  },
  {
    id: 4,
    name: 'Viewer Demo',
    email: 'viewer@transitops.com',
    phone: '+1 555 010 1003',
    password: 'viewer123',
    role: 'VIEWER',
    status: 'ACTIVE',
  },
];

const issuedTokens = new Map();
const pendingEmailCodes = new Map();
const pendingPhoneCodes = new Map();

const nowIso = () => new Date().toISOString();
const CURRENT_YEAR = new Date().getFullYear();
const EMAIL_CODE = '123456';
const PHONE_CODE = '654321';
const CODE_EXPIRATION_MINUTES = 10;

const VEHICLE_STATUSES = new Set(['AVAILABLE', 'MAINTENANCE', 'INACTIVE']);
const DRIVER_STATUSES = new Set(['ACTIVE', 'SUSPENDED', 'INACTIVE']);
const ROUTE_STATUSES = new Set(['ACTIVE', 'INACTIVE']);
const TRIP_STATUSES = new Set(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const PUBLIC_REGISTRATION_ROLES = new Set(['VIEWER', 'OPERATOR', 'SUPERVISOR']);
const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/request-email-code',
  '/api/auth/request-phone-code',
  '/api/auth/register',
]);

const TRIP_STATUS_TRANSITIONS = {
  SCHEDULED: new Set(['IN_PROGRESS', 'CANCELLED']),
  IN_PROGRESS: new Set(['COMPLETED', 'CANCELLED']),
  COMPLETED: new Set(),
  CANCELLED: new Set(),
};

function hasField(payload, key) {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeString(value);
}

function canonicalPhone(value) {
  return normalizePhone(value).replace(/[()\s-]/g, '');
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStatus(value, allowedStatuses) {
  const normalized = normalizeString(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^\+?[0-9 ()-]{8,20}$/.test(value);
}

function findUserByEmail(email) {
  return demoUsers.find((entry) => entry.email === email);
}

function findUserByPhone(phone) {
  const normalizedPhone = canonicalPhone(phone);

  return demoUsers.find((entry) => entry.phone && canonicalPhone(entry.phone) === normalizedPhone);
}

function issueVerificationCode(store, destination, code) {
  store.set(destination, {
    code,
    expiresAt: Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000,
  });

  return {
    destination,
    code,
    expiresInMinutes: CODE_EXPIRATION_MINUTES,
  };
}

function isVerificationCodeValid(store, destination, code) {
  const issuedCode = store.get(destination);

  if (!issuedCode || issuedCode.code !== code) {
    return false;
  }

  if (issuedCode.expiresAt < Date.now()) {
    store.delete(destination);
    return false;
  }

  return true;
}

const vehicles = [
  {
    id: 'veh-1',
    unitNumber: 'ABC-123',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2021,
    capacity: 18,
    status: 'AVAILABLE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'veh-2',
    unitNumber: 'XYZ-987',
    brand: 'Volvo',
    model: '7900',
    year: 2020,
    capacity: 40,
    status: 'MAINTENANCE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const drivers = [
  {
    id: 'drv-1',
    firstName: 'Lucia',
    lastName: 'Rojas',
    licenseNumber: 'LIC-102030',
    phone: '+34 600 111 222',
    email: 'lucia.rojas@transitops.com',
    status: 'ACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'drv-2',
    firstName: 'Martin',
    lastName: 'Lopez',
    licenseNumber: 'LIC-112233',
    phone: '+34 600 333 444',
    email: 'martin.lopez@transitops.com',
    status: 'INACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const routes = [
  {
    id: 'rte-1',
    name: 'Centro - Aeropuerto',
    origin: 'Terminal Centro',
    destination: 'Aeropuerto T1',
    distanceKm: 23.4,
    estimatedDurationMinutes: 38,
    status: 'ACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'rte-2',
    name: 'Norte - Sur',
    origin: 'Estacion Norte',
    destination: 'Terminal Sur',
    distanceKm: 17.2,
    estimatedDurationMinutes: 31,
    status: 'INACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const trips = [
  {
    id: 'trp-1',
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    routeId: 'rte-1',
    scheduledDeparture: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
    notes: 'Servicio matutino',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'trp-2',
    vehicleId: 'veh-2',
    driverId: 'drv-2',
    routeId: 'rte-2',
    scheduledDeparture: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    notes: 'Sin incidencias',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

function ok(res, message, data) {
  return res.json({
    success: true,
    message,
    data,
  });
}

function fail(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
}

function authMiddleware(req, res, next) {
  if (PUBLIC_API_PATHS.has(req.path)) {
    return next();
  }

  const header = req.header('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 401, 'Missing or invalid authorization token.');
  }

  const token = header.replace('Bearer ', '').trim();

  if (!issuedTokens.has(token)) {
    return fail(res, 401, 'Session expired or invalid token.');
  }

  req.user = issuedTokens.get(token);
  next();
}

app.use(authMiddleware);

app.get('/api/health', (_req, res) => {
  ok(res, 'TransitOps API is running.', {
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '').trim();

  if (!email || !password) {
    return fail(res, 400, 'Email and password are required.');
  }

  const user = demoUsers.find((entry) => entry.email === email && entry.password === password);

  if (!user) {
    return fail(res, 401, 'Invalid credentials.');
  }

  const token = `dev-${crypto.randomUUID()}`;
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  issuedTokens.set(token, safeUser);

  return ok(res, 'Login successful.', {
    token,
    user: safeUser,
  });
});

app.post('/api/auth/request-email-code', (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return fail(res, 400, 'Email is required.');
  }

  if (!isValidEmail(email)) {
    return fail(res, 400, 'Email must be valid.');
  }

  if (findUserByEmail(email)) {
    return fail(res, 409, 'Email is already registered.');
  }

  return ok(
    res,
    'Email verification code generated. Use mock code 123456 for development only.',
    issueVerificationCode(pendingEmailCodes, email, EMAIL_CODE),
  );
});

app.post('/api/auth/request-phone-code', (req, res) => {
  const phone = normalizePhone(req.body?.phone);

  if (!phone) {
    return fail(res, 400, 'Phone is required.');
  }

  if (!isValidPhone(phone)) {
    return fail(res, 400, 'Phone must be valid.');
  }

  if (findUserByPhone(phone)) {
    return fail(res, 409, 'Phone is already registered.');
  }

  return ok(
    res,
    'Phone verification code generated. Use mock code 654321 for development only.',
    issueVerificationCode(pendingPhoneCodes, canonicalPhone(phone), PHONE_CODE),
  );
});

app.post('/api/auth/register', (req, res) => {
  const payload = req.body || {};
  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const phone = normalizePhone(payload.phone);
  const phoneCode = normalizeString(payload.phoneCode);
  const email = normalizeEmail(payload.email);
  const emailCode = normalizeString(payload.emailCode);
  const password = normalizeString(payload.password);
  const confirmPassword = normalizeString(payload.confirmPassword);
  const requestedRole = normalizeString(payload.requestedRole).toUpperCase();

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !phoneCode ||
    !email ||
    !emailCode ||
    !password ||
    !confirmPassword ||
    !requestedRole
  ) {
    return fail(res, 400, 'All registration fields are required.');
  }

  if (!isValidEmail(email)) {
    return fail(res, 400, 'Email must be valid.');
  }

  if (!isValidPhone(phone)) {
    return fail(res, 400, 'Phone must be valid.');
  }

  if (password.length < 8) {
    return fail(res, 400, 'Password must have at least 8 characters.');
  }

  if (password !== confirmPassword) {
    return fail(res, 400, 'Password confirmation does not match.');
  }

  if (requestedRole === 'ADMIN') {
    return fail(res, 400, 'ADMIN cannot be requested through public registration.');
  }

  if (!PUBLIC_REGISTRATION_ROLES.has(requestedRole)) {
    return fail(res, 400, 'Requested role is invalid.');
  }

  if (findUserByEmail(email)) {
    return fail(res, 409, 'Email is already registered.');
  }

  if (findUserByPhone(phone)) {
    return fail(res, 409, 'Phone is already registered.');
  }

  if (!isVerificationCodeValid(pendingEmailCodes, email, emailCode)) {
    return fail(res, 400, 'Email verification code is invalid.');
  }

  const phoneDestination = canonicalPhone(phone);

  if (!isVerificationCodeValid(pendingPhoneCodes, phoneDestination, phoneCode)) {
    return fail(res, 400, 'Phone verification code is invalid.');
  }

  const id = Math.max(...demoUsers.map((entry) => entry.id)) + 1;
  const user = {
    id,
    name: `${firstName} ${lastName}`,
    email,
    phone,
    password,
    role: requestedRole,
    status: 'ACTIVE',
  };

  demoUsers.push(user);
  pendingEmailCodes.delete(email);
  pendingPhoneCodes.delete(phoneDestination);

  return ok(res, 'Registration successful.', {
    id: user.id,
    email: user.email,
    phone: user.phone,
    requestedRole: user.role,
  });
});

app.get('/api/vehicles', (req, res) => {
  const status = req.query?.status ? normalizeString(req.query.status).toUpperCase() : '';
  const q = req.query?.q ? String(req.query.q).toLowerCase() : '';

  const filtered = vehicles.filter((item) => {
    const statusMatch = !status || item.status === status;
    const qMatch =
      !q ||
      item.unitNumber.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q);

    return statusMatch && qMatch;
  });

  return ok(res, 'Vehicles loaded.', filtered);
});

app.get('/api/vehicles/:id', (req, res) => {
  const item = vehicles.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Vehicle not found.');
  }

  return ok(res, 'Vehicle loaded.', item);
});

app.post('/api/vehicles', (req, res) => {
  const payload = req.body || {};
  const unitNumber = normalizeString(payload.unitNumber).toUpperCase();
  const brand = normalizeString(payload.brand);
  const model = normalizeString(payload.model);
  const year = parseNumber(payload.year);
  const capacity = parseNumber(payload.capacity);
  const status = parseStatus(payload.status || 'AVAILABLE', VEHICLE_STATUSES);

  if (!unitNumber || !brand || !model) {
    return fail(res, 400, 'unitNumber, brand and model are required.');
  }

  if (!Number.isInteger(year) || year < 1990 || year > CURRENT_YEAR + 1) {
    return fail(res, 400, 'year must be between 1990 and next year.');
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 120) {
    return fail(res, 400, 'capacity must be between 1 and 120.');
  }

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  let lastMaintenanceDate;

  if (payload.lastMaintenanceDate) {
    const parsedDate = new Date(payload.lastMaintenanceDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return fail(res, 400, 'lastMaintenanceDate must be a valid date.');
    }

    lastMaintenanceDate = parsedDate.toISOString();
  }

  const item = {
    id: `veh-${crypto.randomUUID().slice(0, 8)}`,
    unitNumber,
    brand,
    model,
    year,
    capacity,
    status,
    lastMaintenanceDate,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  vehicles.unshift(item);
  return ok(res, 'Vehicle created.', item);
});

app.patch('/api/vehicles/:id', (req, res) => {
  const item = vehicles.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Vehicle not found.');
  }

  const payload = req.body || {};
  const updates = {};

  if (hasField(payload, 'unitNumber')) {
    const unitNumber = normalizeString(payload.unitNumber).toUpperCase();

    if (!unitNumber) {
      return fail(res, 400, 'unitNumber cannot be empty.');
    }

    updates.unitNumber = unitNumber;
  }

  if (hasField(payload, 'brand')) {
    const brand = normalizeString(payload.brand);

    if (!brand) {
      return fail(res, 400, 'brand cannot be empty.');
    }

    updates.brand = brand;
  }

  if (hasField(payload, 'model')) {
    const model = normalizeString(payload.model);

    if (!model) {
      return fail(res, 400, 'model cannot be empty.');
    }

    updates.model = model;
  }

  if (hasField(payload, 'year')) {
    const year = parseNumber(payload.year);

    if (!Number.isInteger(year) || year < 1990 || year > CURRENT_YEAR + 1) {
      return fail(res, 400, 'year must be between 1990 and next year.');
    }

    updates.year = year;
  }

  if (hasField(payload, 'capacity')) {
    const capacity = parseNumber(payload.capacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 120) {
      return fail(res, 400, 'capacity must be between 1 and 120.');
    }

    updates.capacity = capacity;
  }

  if (hasField(payload, 'lastMaintenanceDate')) {
    if (!payload.lastMaintenanceDate) {
      updates.lastMaintenanceDate = undefined;
    } else {
      const parsedDate = new Date(payload.lastMaintenanceDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return fail(res, 400, 'lastMaintenanceDate must be a valid date.');
      }

      updates.lastMaintenanceDate = parsedDate.toISOString();
    }
  }

  if (hasField(payload, 'status')) {
    const status = parseStatus(payload.status, VEHICLE_STATUSES);

    if (!status) {
      return fail(res, 400, 'status is invalid.');
    }

    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return fail(res, 400, 'No valid fields were provided for update.');
  }

  Object.assign(item, updates, { updatedAt: nowIso() });
  return ok(res, 'Vehicle updated.', item);
});

app.patch('/api/vehicles/:id/status', (req, res) => {
  const item = vehicles.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Vehicle not found.');
  }

  const status = parseStatus(req.body?.status, VEHICLE_STATUSES);

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  item.status = status;
  item.updatedAt = nowIso();

  return ok(res, 'Vehicle status updated.', item);
});

app.delete('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex((entry) => entry.id === req.params.id);

  if (index === -1) {
    return fail(res, 404, 'Vehicle not found.');
  }

  vehicles.splice(index, 1);
  return ok(res, 'Vehicle deleted.', null);
});

app.get('/api/drivers', (_req, res) => ok(res, 'Drivers loaded.', drivers));

app.get('/api/drivers/:id', (req, res) => {
  const item = drivers.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Driver not found.');
  }

  return ok(res, 'Driver loaded.', item);
});

app.post('/api/drivers', (req, res) => {
  const payload = req.body || {};
  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const licenseNumber = normalizeString(payload.licenseNumber).toUpperCase();
  const phone = normalizeString(payload.phone);
  const email = normalizeString(payload.email).toLowerCase();
  const status = parseStatus(payload.status || 'ACTIVE', DRIVER_STATUSES);

  if (!firstName || !lastName || !licenseNumber) {
    return fail(res, 400, 'firstName, lastName and licenseNumber are required.');
  }

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  const item = {
    id: `drv-${crypto.randomUUID().slice(0, 8)}`,
    firstName,
    lastName,
    licenseNumber,
    phone,
    email,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  drivers.unshift(item);
  return ok(res, 'Driver created.', item);
});

app.patch('/api/drivers/:id', (req, res) => {
  const item = drivers.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Driver not found.');
  }

  const payload = req.body || {};
  const updates = {};

  if (hasField(payload, 'firstName')) {
    const firstName = normalizeString(payload.firstName);

    if (!firstName) {
      return fail(res, 400, 'firstName cannot be empty.');
    }

    updates.firstName = firstName;
  }

  if (hasField(payload, 'lastName')) {
    const lastName = normalizeString(payload.lastName);

    if (!lastName) {
      return fail(res, 400, 'lastName cannot be empty.');
    }

    updates.lastName = lastName;
  }

  if (hasField(payload, 'licenseNumber')) {
    const licenseNumber = normalizeString(payload.licenseNumber).toUpperCase();

    if (!licenseNumber) {
      return fail(res, 400, 'licenseNumber cannot be empty.');
    }

    updates.licenseNumber = licenseNumber;
  }

  if (hasField(payload, 'phone')) {
    updates.phone = normalizeString(payload.phone);
  }

  if (hasField(payload, 'email')) {
    updates.email = normalizeString(payload.email).toLowerCase();
  }

  if (hasField(payload, 'status')) {
    const status = parseStatus(payload.status, DRIVER_STATUSES);

    if (!status) {
      return fail(res, 400, 'status is invalid.');
    }

    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return fail(res, 400, 'No valid fields were provided for update.');
  }

  Object.assign(item, updates, { updatedAt: nowIso() });
  return ok(res, 'Driver updated.', item);
});

app.patch('/api/drivers/:id/status', (req, res) => {
  const item = drivers.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Driver not found.');
  }

  const status = parseStatus(req.body?.status, DRIVER_STATUSES);

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  item.status = status;
  item.updatedAt = nowIso();

  return ok(res, 'Driver status updated.', item);
});

app.delete('/api/drivers/:id', (req, res) => {
  const index = drivers.findIndex((entry) => entry.id === req.params.id);

  if (index === -1) {
    return fail(res, 404, 'Driver not found.');
  }

  drivers.splice(index, 1);
  return ok(res, 'Driver deleted.', null);
});

app.get('/api/routes', (_req, res) => ok(res, 'Routes loaded.', routes));

app.get('/api/routes/:id', (req, res) => {
  const item = routes.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Route not found.');
  }

  return ok(res, 'Route loaded.', item);
});

app.post('/api/routes', (req, res) => {
  const payload = req.body || {};
  const name = normalizeString(payload.name);
  const origin = normalizeString(payload.origin);
  const destination = normalizeString(payload.destination);
  const distanceKm = parseNumber(payload.distanceKm);
  const estimatedDurationMinutes = parseNumber(payload.estimatedDurationMinutes);
  const status = parseStatus(payload.status || 'ACTIVE', ROUTE_STATUSES);

  if (!name || !origin || !destination) {
    return fail(res, 400, 'name, origin and destination are required.');
  }

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return fail(res, 400, 'distanceKm must be greater than 0.');
  }

  if (!Number.isInteger(estimatedDurationMinutes) || estimatedDurationMinutes <= 0) {
    return fail(res, 400, 'estimatedDurationMinutes must be a positive integer.');
  }

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  const item = {
    id: `rte-${crypto.randomUUID().slice(0, 8)}`,
    name,
    origin,
    destination,
    distanceKm,
    estimatedDurationMinutes,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  routes.unshift(item);
  return ok(res, 'Route created.', item);
});

app.patch('/api/routes/:id', (req, res) => {
  const item = routes.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Route not found.');
  }

  const payload = req.body || {};
  const updates = {};

  if (hasField(payload, 'name')) {
    const name = normalizeString(payload.name);

    if (!name) {
      return fail(res, 400, 'name cannot be empty.');
    }

    updates.name = name;
  }

  if (hasField(payload, 'origin')) {
    const origin = normalizeString(payload.origin);

    if (!origin) {
      return fail(res, 400, 'origin cannot be empty.');
    }

    updates.origin = origin;
  }

  if (hasField(payload, 'destination')) {
    const destination = normalizeString(payload.destination);

    if (!destination) {
      return fail(res, 400, 'destination cannot be empty.');
    }

    updates.destination = destination;
  }

  if (hasField(payload, 'distanceKm')) {
    const distanceKm = parseNumber(payload.distanceKm);

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      return fail(res, 400, 'distanceKm must be greater than 0.');
    }

    updates.distanceKm = distanceKm;
  }

  if (hasField(payload, 'estimatedDurationMinutes')) {
    const estimatedDurationMinutes = parseNumber(payload.estimatedDurationMinutes);

    if (!Number.isInteger(estimatedDurationMinutes) || estimatedDurationMinutes <= 0) {
      return fail(res, 400, 'estimatedDurationMinutes must be a positive integer.');
    }

    updates.estimatedDurationMinutes = estimatedDurationMinutes;
  }

  if (hasField(payload, 'status')) {
    const status = parseStatus(payload.status, ROUTE_STATUSES);

    if (!status) {
      return fail(res, 400, 'status is invalid.');
    }

    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return fail(res, 400, 'No valid fields were provided for update.');
  }

  Object.assign(item, updates, { updatedAt: nowIso() });
  return ok(res, 'Route updated.', item);
});

app.patch('/api/routes/:id/status', (req, res) => {
  const item = routes.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Route not found.');
  }

  const status = parseStatus(req.body?.status, ROUTE_STATUSES);

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  item.status = status;
  item.updatedAt = nowIso();

  return ok(res, 'Route status updated.', item);
});

app.delete('/api/routes/:id', (req, res) => {
  const index = routes.findIndex((entry) => entry.id === req.params.id);

  if (index === -1) {
    return fail(res, 404, 'Route not found.');
  }

  routes.splice(index, 1);
  return ok(res, 'Route deleted.', null);
});

function withTripRelations(trip) {
  return {
    ...trip,
    vehicle: vehicles.find((entry) => entry.id === trip.vehicleId),
    driver: drivers.find((entry) => entry.id === trip.driverId),
    route: routes.find((entry) => entry.id === trip.routeId),
  };
}

app.get('/api/trips', (_req, res) => {
  return ok(res, 'Trips loaded.', trips.map(withTripRelations));
});

app.get('/api/trips/:id', (req, res) => {
  const item = trips.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Trip not found.');
  }

  return ok(res, 'Trip loaded.', withTripRelations(item));
});

app.post('/api/trips', (req, res) => {
  const payload = req.body || {};
  const vehicleId = normalizeString(payload.vehicleId);
  const driverId = normalizeString(payload.driverId);
  const routeId = normalizeString(payload.routeId);
  const scheduledDepartureDate = new Date(payload.scheduledDeparture);
  const notes = normalizeString(payload.notes);

  if (!vehicleId || !driverId || !routeId || !payload.scheduledDeparture) {
    return fail(res, 400, 'vehicleId, driverId, routeId and scheduledDeparture are required.');
  }

  if (Number.isNaN(scheduledDepartureDate.getTime())) {
    return fail(res, 400, 'scheduledDeparture must be a valid date.');
  }

  const vehicle = vehicles.find((entry) => entry.id === vehicleId);
  const driver = drivers.find((entry) => entry.id === driverId);
  const route = routes.find((entry) => entry.id === routeId);

  if (!vehicle) {
    return fail(res, 400, 'Selected vehicle does not exist.');
  }

  if (!driver) {
    return fail(res, 400, 'Selected driver does not exist.');
  }

  if (!route) {
    return fail(res, 400, 'Selected route does not exist.');
  }

  if (vehicle.status !== 'AVAILABLE') {
    return fail(res, 409, 'Vehicle must be AVAILABLE to schedule a trip.');
  }

  if (driver.status !== 'ACTIVE') {
    return fail(res, 409, 'Driver must be ACTIVE to schedule a trip.');
  }

  if (route.status !== 'ACTIVE') {
    return fail(res, 409, 'Route must be ACTIVE to schedule a trip.');
  }

  const item = {
    id: `trp-${crypto.randomUUID().slice(0, 8)}`,
    vehicleId,
    driverId,
    routeId,
    scheduledDeparture: scheduledDepartureDate.toISOString(),
    status: 'SCHEDULED',
    notes: notes || undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  trips.unshift(item);
  return ok(res, 'Trip created.', withTripRelations(item));
});

app.patch('/api/trips/:id/status', (req, res) => {
  const item = trips.find((entry) => entry.id === req.params.id);

  if (!item) {
    return fail(res, 404, 'Trip not found.');
  }

  const status = parseStatus(req.body?.status, TRIP_STATUSES);

  if (!status) {
    return fail(res, 400, 'status is invalid.');
  }

  const allowedTransitions = TRIP_STATUS_TRANSITIONS[item.status] || new Set();

  if (status !== item.status && !allowedTransitions.has(status)) {
    return fail(res, 409, `Cannot change trip status from ${item.status} to ${status}.`);
  }

  item.status = status;
  item.updatedAt = nowIso();

  return ok(res, 'Trip status updated.', withTripRelations(item));
});

app.delete('/api/trips/:id', (req, res) => {
  const index = trips.findIndex((entry) => entry.id === req.params.id);

  if (index === -1) {
    return fail(res, 404, 'Trip not found.');
  }

  trips.splice(index, 1);
  return ok(res, 'Trip deleted.', null);
});

app.get('/api/dashboard/summary', (_req, res) => {
  const stats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    maintenanceVehicles: vehicles.filter((v) => v.status === 'MAINTENANCE').length,

    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((d) => d.status === 'ACTIVE').length,
    suspendedDrivers: drivers.filter((d) => d.status === 'SUSPENDED').length,

    totalRoutes: routes.length,
    activeRoutes: routes.filter((r) => r.status === 'ACTIVE').length,

    totalTrips: trips.length,
    scheduledTrips: trips.filter((t) => t.status === 'SCHEDULED').length,
    inProgressTrips: trips.filter((t) => t.status === 'IN_PROGRESS').length,
    completedTrips: trips.filter((t) => t.status === 'COMPLETED').length,
    cancelledTrips: trips.filter((t) => t.status === 'CANCELLED').length,
  };

  const latestTrips = [...trips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(withTripRelations);

  return ok(res, 'Dashboard summary loaded.', {
    stats,
    latestTrips,
  });
});

app.use('/api', (_req, res) => {
  return fail(res, 404, 'Endpoint not found.');
});

app.listen(PORT, () => {
  console.log(`TransitOps API listening on http://localhost:${PORT}`);
  console.log('Demo credentials:');
  console.log(' - admin@transitops.com / admin123');
  console.log(' - operator@transitops.com / operator123');
  console.log(' - supervisor@transitops.com / supervisor123');
  console.log(' - viewer@transitops.com / viewer123');
});
