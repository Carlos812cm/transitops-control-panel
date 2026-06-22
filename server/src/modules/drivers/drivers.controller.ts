import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import {
  createDriver,
  deleteDriver,
  getDriverById,
  listDrivers,
  updateDriver,
  updateDriverStatus,
} from './drivers.service.js';
import {
  CreateDriverBody,
  DriverIdParams,
  GetDriversQuery,
  UpdateDriverBody,
  UpdateDriverStatusBody,
} from './drivers.schemas.js';

export async function getDrivers(request: Request, response: Response): Promise<Response> {
  const query = request.query as GetDriversQuery;

  const result = await listDrivers({
    search: query.search,
    q: query.q,
    status: query.status,
    page: query.page,
    limit: query.limit,
    pageSize: query.pageSize,
  });

  return sendSuccess(response, 'Drivers retrieved successfully.', result.data, 200, result.meta);
}

export async function getDriver(request: Request, response: Response): Promise<Response> {
  const { id } = request.params as DriverIdParams;

  const driver = await getDriverById(id);

  return sendSuccess(response, 'Driver retrieved successfully.', driver);
}

export async function createDriverRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const payload = request.body as CreateDriverBody;

  const driver = await createDriver(payload);

  return sendSuccess(response, 'Driver created successfully.', driver, 201);
}

export async function updateDriverRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as DriverIdParams;
  const payload = request.body as UpdateDriverBody;

  const driver = await updateDriver(id, payload);

  return sendSuccess(response, 'Driver updated successfully.', driver);
}

export async function updateDriverStatusRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as DriverIdParams;
  const payload = request.body as UpdateDriverStatusBody;

  const driver = await updateDriverStatus(id, payload);

  return sendSuccess(response, 'Driver status updated successfully.', driver);
}

export async function deleteDriverRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as DriverIdParams;

  await deleteDriver(id);

  return sendSuccess(response, 'Driver deleted successfully.', null);
}
