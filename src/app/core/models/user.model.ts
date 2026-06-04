// Este archivo define los modelos relacionados con el usuario, incluyendo los roles, el estado y las interfaces para las solicitudes y respuestas de inicio de sesión.

export type UserRole = 'ADMIN' | 'VIEWER' | 'OPERATOR' | 'SUPERVISOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
