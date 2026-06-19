import { Prisma, User, UserStatus } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/prisma.js';
import { PublicUser, UserFilters } from './users.types.js';
import { buildUserFullName } from '../../common/utils/user-name.js';

function toPublicUser(user: User): PublicUser {
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

function buildUsersWhere(filters: UserFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.q) {
    where.OR = [
      {
        firstName: {
          contains: filters.q,
          mode: 'insensitive',
        },
      },
      {
        lastName: {
          contains: filters.q,
          mode: 'insensitive',
        },
      },
      {
        name: {
          contains: filters.q,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: filters.q,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: filters.q,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

async function findUserOrThrow(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}

function ensureUserCanBeManaged(user: User): void {
  if (user.role === 'ADMIN') {
    throw new AppError('Admin users cannot be modified from this action.', 403);
  }
}

export async function listUsers(filters: UserFilters): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({
    where: buildUsersWhere(filters),
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map(toPublicUser);
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await findUserOrThrow(userId);

  return toPublicUser(user);
}

export async function approveUser(userId: string): Promise<PublicUser> {
  const user = await findUserOrThrow(userId);

  if (user.status !== 'PENDING_APPROVAL') {
    throw new AppError('Only pending users can be approved.', 400);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: user.requestedRole ?? user.role,
      requestedRole: null,
      status: 'ACTIVE',
    },
  });

  return toPublicUser(updatedUser);
}

export async function rejectUser(userId: string): Promise<PublicUser> {
  const user = await findUserOrThrow(userId);

  if (user.status !== 'PENDING_APPROVAL') {
    throw new AppError('Only pending users can be rejected.', 400);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: 'REJECTED',
    },
  });

  return toPublicUser(updatedUser);
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<PublicUser> {
  const user = await findUserOrThrow(userId);

  ensureUserCanBeManaged(user);

  if (status === 'PENDING_APPROVAL') {
    throw new AppError('User status cannot be changed back to pending approval.', 400);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
  });

  return toPublicUser(updatedUser);
}
