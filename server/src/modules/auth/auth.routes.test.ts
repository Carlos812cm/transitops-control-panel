import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';

describe('POST /api/auth/login', () => {
  it('logs in an active seeded admin user', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'admin123',
    });

    expect(response.body.data.user).toMatchObject({
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      avatarUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password.');
  });
});

describe('GET /api/auth/profile', () => {
  it('returns the authenticated user profile', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@transitops.com',
      password: 'admin123',
    });

    const token = loginResponse.body.data.token as string;

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data).toMatchObject({
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      avatarUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('rejects requests without token', async () => {
    const response = await request(app).get('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('PATCH /api/auth/profile', () => {
  const originalViewerProfile = {
    firstName: 'Viewer',
    lastName: 'Demo',
    email: 'viewer@transitops.com',
    phone: '+525500000004',
  };

  let viewerToken = '';

  function buildProfileBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...originalViewerProfile,
      ...overrides,
    };
  }

  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: originalViewerProfile.email,
      password: 'viewer123',
    });

    expect(loginResponse.status).toBe(200);

    viewerToken = loginResponse.body.data.token as string;
  });

  afterEach(async () => {
    const restoreResponse = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        ...originalViewerProfile,
        currentPassword: 'viewer123',
      });

    expect(restoreResponse.status).toBe(200);
  });

  it('updates and normalizes the authenticated user profile', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          firstName: '  Valeria  ',
          lastName: "O'Connor",
          phone: '+52 (55) 9999-9904',
        }),
      );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Profile updated successfully.');

    expect(response.body.data).toMatchObject({
      name: "Valeria O'Connor",
      firstName: 'Valeria',
      lastName: "O'Connor",
      email: 'viewer@transitops.com',
      phone: '+525599999904',
      role: 'VIEWER',
      status: 'ACTIVE',
    });

    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('requires the current password when changing email', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          email: 'viewer.updated@transitops.com',
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Current password is required to change email.');
  });

  it('rejects an incorrect current password when changing email', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          email: 'viewer.updated@transitops.com',
          currentPassword: 'incorrect-password',
        }),
      );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Current password is incorrect.');
  });

  it('updates and normalizes email with a valid current password', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          email: '  VIEWER.UPDATED@TRANSITOPS.COM  ',
          currentPassword: 'viewer123',
        }),
      );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('viewer.updated@transitops.com');
  });

  it('rejects an email already used by another account', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          email: 'admin@transitops.com',
          currentPassword: 'viewer123',
        }),
      );

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email is already in use.');
  });

  it('rejects a phone number already used by another account', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          phone: '+525500000001',
        }),
      );

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Phone number is already in use.');
  });

  it('rejects attempts to update role or account status', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          role: 'ADMIN',
          status: 'ACTIVE',
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
  });

  it('rejects invalid characters in personal names', async () => {
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(
        buildProfileBody({
          firstName: 'V1ewer',
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
  });

  it('rejects profile updates without authentication', async () => {
    const response = await request(app).patch('/api/auth/profile').send(originalViewerProfile);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});

describe('PATCH /api/auth/profile/password', () => {
  const operatorCredentials = {
    email: 'operator@transitops.com',
    password: 'operator123',
  };

  const changedPassword = 'Operator456';

  let operatorToken = '';

  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: operatorCredentials.email,
      password: operatorCredentials.password,
    });

    expect(loginResponse.status).toBe(200);

    operatorToken = loginResponse.body.data.token as string;
  });

  afterEach(async () => {
    const originalPasswordHash = await bcrypt.hash(operatorCredentials.password, 10);

    await prisma.user.update({
      where: {
        email: operatorCredentials.email,
      },
      data: {
        passwordHash: originalPasswordHash,
      },
    });
  });

  it('changes the authenticated user password', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: operatorCredentials.password,
        newPassword: changedPassword,
        confirmPassword: changedPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Password changed successfully.',
    });

    expect(response.body.data).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();

    const oldPasswordLogin = await request(app).post('/api/auth/login').send({
      email: operatorCredentials.email,
      password: operatorCredentials.password,
    });

    expect(oldPasswordLogin.status).toBe(401);
    expect(oldPasswordLogin.body.message).toBe('Invalid email or password.');

    const newPasswordLogin = await request(app).post('/api/auth/login').send({
      email: operatorCredentials.email,
      password: changedPassword,
    });

    expect(newPasswordLogin.status).toBe(200);
    expect(newPasswordLogin.body.success).toBe(true);
    expect(newPasswordLogin.body.data.user.email).toBe(operatorCredentials.email);
    expect(newPasswordLogin.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects an incorrect current password', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: 'incorrect-password',
        newPassword: changedPassword,
        confirmPassword: changedPassword,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Current password is incorrect.');
  });

  it('rejects a password confirmation that does not match', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: operatorCredentials.password,
        newPassword: changedPassword,
        confirmPassword: 'Different456',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
    expect(response.body.errors['body.confirmPassword']).toContain(
      'Password confirmation does not match.',
    );
  });

  it('rejects a new password without a number', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: operatorCredentials.password,
        newPassword: 'OnlyLetters',
        confirmPassword: 'OnlyLetters',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
    expect(response.body.errors['body.newPassword']).toContain(
      'New password must contain at least one number.',
    );
  });

  it('rejects reuse of the current password', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: operatorCredentials.password,
        newPassword: operatorCredentials.password,
        confirmPassword: operatorCredentials.password,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
    expect(response.body.errors['body.newPassword']).toContain(
      'New password must be different from current password.',
    );
  });

  it('rejects fields outside the password contract', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/password')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        currentPassword: operatorCredentials.password,
        newPassword: changedPassword,
        confirmPassword: changedPassword,
        role: 'ADMIN',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed.');
  });

  it('rejects password changes without authentication', async () => {
    const response = await request(app).patch('/api/auth/profile/password').send({
      currentPassword: operatorCredentials.password,
      newPassword: changedPassword,
      confirmPassword: changedPassword,
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});
