import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  response: Response,
  message: string,
  data?: T,
  statusCode = 200,
): Response<ApiResponse<T>> {
  const body: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    body.data = data;
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
