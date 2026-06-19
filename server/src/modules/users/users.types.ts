import { UserRole, UserStatus } from '@prisma/client';

export interface PublicUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  requestedRole: UserRole | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilters {
  q?: string;
  status?: UserStatus;
  role?: UserRole;
}
