import { Request, Response } from 'express';

import { env } from '../../config/env.js';
import { sendSuccess } from '../../common/responses/api-response.js';

export function getHealth(_request: Request, response: Response): Response {
  return sendSuccess(response, 'TransitOps real API is running.', {
    service: 'transitops-api',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
