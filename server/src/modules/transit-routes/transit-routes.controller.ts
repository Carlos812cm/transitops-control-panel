import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import {
  createTransitRoute,
  deleteTransitRoute,
  getTransitRouteById,
  listTransitRoutes,
  updateTransitRoute,
  updateTransitRouteStatus,
} from './transit-routes.service.js';
import {
  CreateTransitRouteBody,
  GetTransitRoutesQuery,
  TransitRouteIdParams,
  UpdateTransitRouteBody,
  UpdateTransitRouteStatusBody,
} from './transit-routes.schemas.js';

export async function getTransitRoutes(
  request: Request,
  response: Response,
): Promise<Response> {
  const query = request.query as GetTransitRoutesQuery;

  const result = await listTransitRoutes({
    search: query.search,
    q: query.q,
    status: query.status,
    page: query.page,
    limit: query.limit,
    pageSize: query.pageSize,
  });

  return sendSuccess(response, 'Routes retrieved successfully.', result.data, 200, result.meta);
}

export async function getTransitRoute(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TransitRouteIdParams;

  const route = await getTransitRouteById(id);

  return sendSuccess(response, 'Route retrieved successfully.', route);
}

export async function createTransitRouteRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const payload = request.body as CreateTransitRouteBody;

  const route = await createTransitRoute(payload);

  return sendSuccess(response, 'Route created successfully.', route, 201);
}

export async function updateTransitRouteRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TransitRouteIdParams;
  const payload = request.body as UpdateTransitRouteBody;

  const route = await updateTransitRoute(id, payload);

  return sendSuccess(response, 'Route updated successfully.', route);
}

export async function updateTransitRouteStatusRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TransitRouteIdParams;
  const payload = request.body as UpdateTransitRouteStatusBody;

  const route = await updateTransitRouteStatus(id, payload);

  return sendSuccess(response, 'Route status updated successfully.', route);
}

export async function deleteTransitRouteRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TransitRouteIdParams;

  await deleteTransitRoute(id);

  return sendSuccess(response, 'Route deleted successfully.', null);
}
