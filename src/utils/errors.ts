export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication/Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',

  // Cache errors
  CACHE_ERROR = 'CACHE_ERROR',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ErrorDetails {
  field?: string | undefined;
  value?: unknown;
  constraint?: string;
  context?: Record<string, unknown>;
}

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, ErrorCode.NOT_FOUND, { context: { resource, identifier } });
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string, field?: string, value?: unknown) {
    const message = field
      ? `${resource} with ${field} '${String(value)}' already exists`
      : `${resource} already exists`;
    super(message, 409, ErrorCode.ALREADY_EXISTS, { field, value, context: { resource } });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details);
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 500, ErrorCode.CACHE_ERROR, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: ErrorDetails) {
    super(message, 500, ErrorCode.INTERNAL_ERROR, details);
  }
}
