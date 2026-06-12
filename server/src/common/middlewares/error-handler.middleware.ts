import { ErrorRequestHandler } from 'express';

import { env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';
import { sendError } from '../responses/api-response.js';

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    return sendError(response, error.statusCode, error.message, error.errors);
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return sendError(response, 500, 'Internal server error.');
};
