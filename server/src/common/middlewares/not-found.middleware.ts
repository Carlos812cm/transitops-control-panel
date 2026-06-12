import { Request, Response } from 'express';

import { sendError } from '../responses/api-response.js';

export function notFoundMiddleware(request: Request, response: Response): Response {
  return sendError(
    response,
    404,
    `Endpoint not found: ${request.method} ${request.originalUrl}`,
  );
}
