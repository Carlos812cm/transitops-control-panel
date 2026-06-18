import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { buildUserFullName } from '../../common/utils/user-name.js';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors/app-error.js';
import {
  AuthUser,
  ChangePasswordInput,
  LoginResponseData,
  UpdateProfileInput,
} from './auth.types.js';
import { signAuthToken } from './token.service.js';

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.trim().replace(/[\s()-]/g, '');
}

function getUniqueConstraintField(error: unknown): 'email' | 'phone' | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return null;
  }

  const target = error.meta?.['target'];
  const serializedTarget = Array.isArray(target) ? target.join(',') : String(target ?? '');

  if (serializedTarget.includes('email')) {
    return 'email';
  }

  if (serializedTarget.includes('phone')) {
    return 'phone';
  }

  return null;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: buildUserFullName(user.firstName, user.lastName),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    requestedRole: user.requestedRole,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResponseData> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('User account is not active.', 403);
  }

  const token = signAuthToken({
    sub: user.id,
    role: user.role,
  });

  return {
    token,
    user: toAuthUser(user),
  };
}

export async function getAuthUserById(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError('Authenticated user was not found.', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('User account is not active.', 403);
  }

  return toAuthUser(user);
}

export async function updateAuthUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<AuthUser> {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!currentUser) {
    throw new AppError('Authenticated user was not found.', 401);
  }

  if (currentUser.status !== 'ACTIVE') {
    throw new AppError('User account is not active.', 403);
  }

  const firstName = normalizeName(input.firstName);
  const lastName = normalizeName(input.lastName);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const emailChanged = email !== normalizeEmail(currentUser.email);

  if (emailChanged) {
    if (!input.currentPassword) {
      throw new AppError('Current password is required to change email.', 400, {
        currentPassword: ['Current password is required to change email.'],
      });
    }

    const passwordMatches = await bcrypt.compare(input.currentPassword, currentUser.passwordHash);

    if (!passwordMatches) {
      throw new AppError('Current password is incorrect.', 401);
    }
  }

  const conflictingUser = await prisma.user.findFirst({
    where: {
      id: {
        not: userId,
      },
      OR: [
        {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        {
          phone,
        },
      ],
    },
    select: {
      email: true,
      phone: true,
    },
  });

  if (conflictingUser?.email.toLowerCase() === email) {
    throw new AppError('Email is already in use.', 409, {
      email: ['Email is already in use.'],
    });
  }

  if (conflictingUser?.phone === phone) {
    throw new AppError('Phone number is already in use.', 409, {
      phone: ['Phone number is already in use.'],
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: buildUserFullName(firstName, lastName),
        firstName,
        lastName,
        email,
        phone,
      },
    });

    return toAuthUser(updatedUser);
  } catch (error) {
    const conflictingField = getUniqueConstraintField(error);

    if (conflictingField === 'email') {
      throw new AppError('Email is already in use.', 409, {
        email: ['Email is already in use.'],
      });
    }

    if (conflictingField === 'phone') {
      throw new AppError('Phone number is already in use.', 409, {
        phone: ['Phone number is already in use.'],
      });
    }

    throw error;
  }
}

export async function changeAuthUserPassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!currentUser) {
    throw new AppError('Authenticated user was not found.', 401);
  }

  if (currentUser.status !== 'ACTIVE') {
    throw new AppError('User account is not active.', 403);
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    currentUser.passwordHash,
  );

  if (!currentPasswordMatches) {
    throw new AppError('Current password is incorrect.', 401);
  }

  if (input.newPassword === input.currentPassword) {
    throw new AppError('New password must be different from current password.', 400, {
      newPassword: ['New password must be different from current password.'],
    });
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: newPasswordHash,
    },
  });
}
