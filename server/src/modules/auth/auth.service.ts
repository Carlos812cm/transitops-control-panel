import bcrypt from 'bcrypt';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors/app-error.js';
import { AuthUser, LoginResponseData } from './auth.types.js';
import { signAuthToken } from './token.service.js';

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AuthUser['role'];
  requestedRole: AuthUser['requestedRole'];
  status: AuthUser['status'];
  createdAt: Date;
  updatedAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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
