import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import { getDashboardSummary } from './dashboard.service.js';

export async function getDashboardSummaryRequest(
  _request: Request,
  response: Response,
): Promise<Response> {
  const summary = await getDashboardSummary();

  return sendSuccess(response, 'Dashboard summary retrieved successfully.', summary);
}
