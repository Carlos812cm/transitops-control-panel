import { Response } from 'express';

import type { PaginationMeta } from '../pagination/pagination.js';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  response: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: PaginationMeta,
): Response<ApiResponse<T>> {
  const body: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (meta !== undefined) {
    body.meta = meta;
  }

  return response.status(statusCode).json(body);
}

export function sendError(
  response: Response,
  statusCode: number,
  message: string,
  errors?: Record<string, string[]>,
): Response<ApiResponse<null>> {
  const body: ApiResponse<null> = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  return response.status(statusCode).json(body);
}
