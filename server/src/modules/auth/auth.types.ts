import { UserRole, UserStatus } from '@prisma/client';

export interface AuthUser {
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
export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentPassword?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}
