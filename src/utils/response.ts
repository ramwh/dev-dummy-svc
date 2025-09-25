import { FastifyReply } from 'fastify';
import { AppError } from './errors';
import { loggers } from './logger';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string | undefined;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseHandler {
  static success<T>(
    reply: FastifyReply,
    data: T,
    message?: string,
    statusCode: number = 200
  ): FastifyReply {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return reply.code(statusCode).send(response);
  }

  static paginated<T>(
    reply: FastifyReply,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): FastifyReply {
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return reply.code(200).send(response);
  }

  static error(reply: FastifyReply, error: Error | AppError, statusCode?: number): FastifyReply {
    let errorResponse: ErrorResponse;

    if (error instanceof AppError) {
      // Log application errors at warn level
      loggers.http.warn(
        {
          error: error.toJSON(),
          stack: error.stack,
        },
        `Application error: ${error.message}`
      );

      errorResponse = {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      };

      return reply.code(error.statusCode).send(errorResponse);
    }

    // Log unexpected errors at error level
    loggers.http.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      `Unexpected error: ${error.message}`
    );

    // Handle unexpected errors
    errorResponse = {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: statusCode || 500,
      },
      timestamp: new Date().toISOString(),
    };

    return reply.code(statusCode || 500).send(errorResponse);
  }

  static created<T>(reply: FastifyReply, data: T, message?: string): FastifyReply {
    return ResponseHandler.success(reply, data, message, 201);
  }

  static noContent(reply: FastifyReply): FastifyReply {
    return reply.code(204).send();
  }
}
