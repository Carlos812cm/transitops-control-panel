import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../../app.js';
import { deleteAvatarFile } from '../../common/storage/avatar-storage.service.js';
import { avatarMaxFileSizeBytes } from '../../config/uploads.config.js';
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

describe('PATCH and DELETE /api/auth/profile/avatar', () => {
  const supervisorCredentials = {
    email: 'supervisor@transitops.com',
    password: 'supervisor123',
  };

  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1p8AAAAASUVORK5CYII=',
    'base64',
  );

  let supervisorToken = '';

  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: supervisorCredentials.email,
      password: supervisorCredentials.password,
    });

    expect(loginResponse.status).toBe(200);

    supervisorToken = loginResponse.body.data.token as string;
  });

  afterEach(async () => {
    const supervisor = await prisma.user.findUnique({
      where: {
        email: supervisorCredentials.email,
      },
      select: {
        avatarUrl: true,
      },
    });

    await deleteAvatarFile(supervisor?.avatarUrl);

    await prisma.user.update({
      where: {
        email: supervisorCredentials.email,
      },
      data: {
        avatarUrl: null,
      },
    });
  });

  it('uploads and serves a valid profile avatar', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', validPngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Avatar updated successfully.');

    expect(response.body.data).toMatchObject({
      email: supervisorCredentials.email,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
    });

    expect(response.body.data.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);

    expect(response.body.data.passwordHash).toBeUndefined();

    const avatarResponse = await request(app).get(response.body.data.avatarUrl);

    expect(avatarResponse.status).toBe(200);
    expect(avatarResponse.headers['content-type']).toMatch(/^image\/png/);
    expect(avatarResponse.body.length).toBeGreaterThan(0);
  });

  it('replaces the previous avatar and deletes its file', async () => {
    const firstUploadResponse = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', validPngBuffer, {
        filename: 'first-avatar.png',
        contentType: 'image/png',
      });

    expect(firstUploadResponse.status).toBe(200);

    const firstAvatarUrl = firstUploadResponse.body.data.avatarUrl as string;

    const secondUploadResponse = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', validPngBuffer, {
        filename: 'second-avatar.png',
        contentType: 'image/png',
      });

    expect(secondUploadResponse.status).toBe(200);

    const secondAvatarUrl = secondUploadResponse.body.data.avatarUrl as string;

    expect(secondAvatarUrl).not.toBe(firstAvatarUrl);

    const previousAvatarResponse = await request(app).get(firstAvatarUrl);

    expect(previousAvatarResponse.status).toBe(404);

    const currentAvatarResponse = await request(app).get(secondAvatarUrl);

    expect(currentAvatarResponse.status).toBe(200);
  });

  it('deletes the current avatar', async () => {
    const uploadResponse = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', validPngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(uploadResponse.status).toBe(200);

    const avatarUrl = uploadResponse.body.data.avatarUrl as string;

    const deleteResponse = await request(app)
      .delete('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Avatar deleted successfully.');
    expect(deleteResponse.body.data.avatarUrl).toBeNull();
    expect(deleteResponse.body.data.passwordHash).toBeUndefined();

    const deletedAvatarResponse = await request(app).get(avatarUrl);

    expect(deletedAvatarResponse.status).toBe(404);
  });

  it('treats repeated avatar deletion as an idempotent operation', async () => {
    const firstDeleteResponse = await request(app)
      .delete('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`);

    const secondDeleteResponse = await request(app)
      .delete('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(firstDeleteResponse.status).toBe(200);
    expect(secondDeleteResponse.status).toBe(200);

    expect(firstDeleteResponse.body.data.avatarUrl).toBeNull();
    expect(secondDeleteResponse.body.data.avatarUrl).toBeNull();
  });

  it('rejects an avatar update without a file', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Avatar file is required.');
    expect(response.body.errors.avatar).toContain('Avatar file is required.');
  });

  it('rejects content that is not a real image', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', Buffer.from('this is not an image'), {
        filename: 'spoofed.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Avatar must be a JPEG, PNG, or WebP image.');
  });

  it('rejects avatar files larger than 2 MB', async () => {
    const oversizedBuffer = Buffer.alloc(avatarMaxFileSizeBytes + 1);

    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('avatar', oversizedBuffer, {
        filename: 'oversized.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Avatar file must not exceed 2 MB.');
  });

  it('rejects an unexpected multipart field name', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .attach('profileImage', validPngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Only one file using the avatar field is allowed.');
  });

  it('rejects avatar uploads without authentication', async () => {
    const response = await request(app)
      .patch('/api/auth/profile/avatar')
      .attach('avatar', validPngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });

  it('rejects avatar deletion without authentication', async () => {
    const response = await request(app).delete('/api/auth/profile/avatar');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });
});