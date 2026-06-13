import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';

import { AppError } from '../errors/app-error.js';

export function authorize(allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.authUser) {
      next(new AppError('Authentication token is required.', 401));
      return;
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      next(new AppError('You do not have permission to access this resource.', 403));
      return;
    }

    next();
  };
}
