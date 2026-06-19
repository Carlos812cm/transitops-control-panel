// Este archivo define los modelos relacionados con el usuario, incluyendo los roles, el estado y las interfaces para las solicitudes y respuestas de inicio de sesión.

export type UserRole = 'ADMIN' | 'VIEWER' | 'OPERATOR' | 'SUPERVISOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';

export type PublicRegistrationRole = Exclude<UserRole, 'ADMIN'>;

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  requestedRole?: UserRole | PublicRegistrationRole | null;
  status: UserStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface VerificationCodeResponseData {
  destination: string;
  code: string;
  expiresInMinutes: number;
}

export interface RequestEmailCodeRequest {
  email: string;
}

export interface RequestPhoneCodeRequest {
  phone: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  phoneCode: string;
  email: string;
  emailCode: string;
  password: string;
  confirmPassword: string;
  requestedRole: PublicRegistrationRole;
}

export interface RegisterResponseData {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  requestedRole: PublicRegistrationRole;
  status: UserStatus;
}
