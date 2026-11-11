import type { Response } from 'express';

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorBody {
  success: false;
  message: string;
  errors: Array<{ field?: string; message: string }>;
}

/** { success: true, message, data } - the only success shape the API returns. */
export function sendSuccess<T>(res: Response, data: T, message = 'Operation successful', statusCode = 200) {
  const body: SuccessBody<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

/** { success: false, message, errors: [] } - the only error shape the API returns. */
export function sendError(
  res: Response,
  statusCode: number,
  message = 'Something went wrong',
  errors: ErrorBody['errors'] = [],
) {
  const body: ErrorBody = { success: false, message, errors };
  return res.status(statusCode).json(body);
}
