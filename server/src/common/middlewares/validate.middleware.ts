import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { AppError } from '../errors/app-error.js';

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';

    if (!errors[path]) {
      errors[path] = [];
    }

    errors[path].push(issue.message);
  }

  return errors;
}

export function validate(schema: ZodSchema) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (!result.success) {
      next(new AppError('Validation failed.', 400, formatZodErrors(result.error)));
      return;
    }

    next();
  };
}
