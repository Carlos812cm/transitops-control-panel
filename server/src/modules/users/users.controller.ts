import { Request, Response } from 'express';

import { sendSuccess } from '../../common/responses/api-response.js';
import {
  approveUser,
  getUserById,
  listUsers,
  rejectUser,
  updateUserStatus,
} from './users.service.js';
import {
  GetUsersQuery,
  UpdateUserStatusBody,
  UserIdParams,
} from './users.schemas.js';

export async function getUsers(request: Request, response: Response): Promise<Response> {
  const query = request.query as GetUsersQuery;

  const users = await listUsers({
    q: query.q,
    status: query.status,
    role: query.role,
  });

  return sendSuccess(response, 'Users retrieved successfully.', users);
}

export async function getUser(request: Request, response: Response): Promise<Response> {
  const { id } = request.params as UserIdParams;

  const user = await getUserById(id);

  return sendSuccess(response, 'User retrieved successfully.', user);
}

export async function approveUserRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as UserIdParams;

  const user = await approveUser(id);

  return sendSuccess(response, 'User approved successfully.', user);
}

export async function rejectUserRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as UserIdParams;

  const user = await rejectUser(id);

  return sendSuccess(response, 'User rejected successfully.', user);
}

export async function updateUserStatusRequest(
  request: Request,
  response: Response,
): Promise<Response> {
  const { id } = request.params as UserIdParams;
  const { status } = request.body as UpdateUserStatusBody;

  const user = await updateUserStatus(id, status);

  return sendSuccess(response, 'User status updated successfully.', user);
}
