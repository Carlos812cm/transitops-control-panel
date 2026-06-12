import { Request, Response } from 'express';

import { AppError } from '../../common/errors/app-error.js';
import { sendSuccess } from '../../common/responses/api-response.js';
import { LoginBody } from './auth.schemas.js';
import { getAuthUserById, loginUser } from './auth.service.js';

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
