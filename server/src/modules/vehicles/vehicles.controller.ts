import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  listVehicles,
  updateVehicle,
  updateVehicleStatus,
} from './vehicles.service.js';
import {
  CreateVehicleBody,
  GetVehiclesQuery,
  UpdateVehicleBody,
  UpdateVehicleStatusBody,
  VehicleIdParams,
} from './vehicles.schemas.js';

export async function getVehicles(request: Request, response: Response): Promise<Response> {
  const query = request.query as GetVehiclesQuery;

  const result = await listVehicles({
    search: query.search,
    q: query.q,
    status: query.status,
    page: query.page,
    limit: query.limit,
    pageSize: query.pageSize,
  });

  return sendSuccess(response, 'Vehicles retrieved successfully.', result.data, 200, result.meta);
}

export async function getVehicle(request: Request, response: Response): Promise<Response> {
  const { id } = request.params as VehicleIdParams;

  const vehicle = await getVehicleById(id);

  return sendSuccess(response, 'Vehicle retrieved successfully.', vehicle);
}

export async function createVehicleRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const payload = request.body as CreateVehicleBody;

  const vehicle = await createVehicle(payload);

  return sendSuccess(response, 'Vehicle created successfully.', vehicle, 201);
}

export async function updateVehicleRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as VehicleIdParams;
  const payload = request.body as UpdateVehicleBody;

  const vehicle = await updateVehicle(id, payload);

  return sendSuccess(response, 'Vehicle updated successfully.', vehicle);
}

export async function updateVehicleStatusRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as VehicleIdParams;
  const payload = request.body as UpdateVehicleStatusBody;

  const vehicle = await updateVehicleStatus(id, payload);

  return sendSuccess(response, 'Vehicle status updated successfully.', vehicle);
}

export async function deleteVehicleRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as VehicleIdParams;

  await deleteVehicle(id);

  return sendSuccess(response, 'Vehicle deleted successfully.', null);
}
