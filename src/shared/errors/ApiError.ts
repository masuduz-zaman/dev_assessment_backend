export interface FieldError {
  field?: string;
  message: string;
}


export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', errors: FieldError[] = []) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }
  static unprocessable(message = 'Validation failed', errors: FieldError[] = []) {
    return new ApiError(422, message, errors);
  }
  static unavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}
