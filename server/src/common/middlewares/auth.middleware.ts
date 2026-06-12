import { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { verifyAuthToken } from '../../modules/auth/token.service.js';

function getBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AppError('Authentication token is required.', 401);
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Invalid authentication token format.', 401);
  }

  return token;
}

export function authenticate(request: Request, _response: Response, next: NextFunction): void {
  try {
    const token = getBearerToken(request.headers.authorization);
    const payload = verifyAuthToken(token);

    request.authUser = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError('Invalid or expired authentication token.', 401));
  }
}
