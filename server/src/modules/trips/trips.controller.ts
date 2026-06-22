import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  updateTripStatus,
} from './trips.service.js';
import {
  CreateTripBody,
  GetTripsQuery,
  TripIdParams,
  UpdateTripStatusBody,
} from './trips.schemas.js';

export async function getTrips(request: Request, response: Response): Promise<Response> {
  const query = request.query as GetTripsQuery;

  const result = await listTrips({
    search: query.search,
    q: query.q,
    status: query.status,
    vehicleId: query.vehicleId,
    driverId: query.driverId,
    routeId: query.routeId,
    page: query.page,
    limit: query.limit,
    pageSize: query.pageSize,
  });

  return sendSuccess(response, 'Trips retrieved successfully.', result.data, 200, result.meta);
}

export async function getTrip(request: Request, response: Response): Promise<Response> {
  const { id } = request.params as TripIdParams;

  const trip = await getTripById(id);

  return sendSuccess(response, 'Trip retrieved successfully.', trip);
}

export async function createTripRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const payload = request.body as CreateTripBody;

  const trip = await createTrip(payload);

  return sendSuccess(response, 'Trip created successfully.', trip, 201);
}

export async function updateTripStatusRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TripIdParams;
  const payload = request.body as UpdateTripStatusBody;

  const trip = await updateTripStatus(id, payload);

  return sendSuccess(response, 'Trip status updated successfully.', trip);
}

export async function deleteTripRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as TripIdParams;

  await deleteTrip(id);

  return sendSuccess(response, 'Trip deleted successfully.', null);
}
