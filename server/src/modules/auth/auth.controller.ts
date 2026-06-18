import { Request, Response } from 'express';

import { AppError } from '../../common/errors/app-error.js';
import { sendSuccess } from '../../common/responses/api-response.js';
import { ChangePasswordBody, LoginBody, UpdateProfileBody } from './auth.schemas.js';
import {
  changeAuthUserPassword,
  getAuthUserById,
  loginUser,
  updateAuthUserProfile,
} from './auth.service.js';

export async function login(request: Request, response: Response): Promise<Response> {
  const { email, password } = request.body as LoginBody;

  const loginResponse = await loginUser(email, password);

  return sendSuccess(response, 'Login successful.', loginResponse);
}

export async function getProfile(request: Request, response: Response): Promise<Response> {
  if (!request.authUser) {
    throw new AppError('Authentication token is required.', 401);
  }

  const user = await getAuthUserById(request.authUser.id);

  return sendSuccess(response, 'Profile retrieved successfully.', user);
}

export async function updateProfile(request: Request, response: Response): Promise<Response> {
  if (!request.authUser) {
    throw new AppError('Authentication token is required.', 401);
  }

  const body = request.body as UpdateProfileBody;

  const user = await updateAuthUserProfile(request.authUser.id, {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    currentPassword: body.currentPassword,
  });

  return sendSuccess(response, 'Profile updated successfully.', user);
}

export async function changePassword(request: Request, response: Response): Promise<Response> {
  if (!request.authUser) {
    throw new AppError('Authentication token is required.', 401);
  }

  const body = request.body as ChangePasswordBody;

  await changeAuthUserPassword(request.authUser.id, {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });

  return sendSuccess(response, 'Password changed successfully.');
}
