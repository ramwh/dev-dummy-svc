/**
 * OpenAPI/Swagger schema definitions for user endpoints
 * These schemas are used for API documentation only
 * Actual validation is handled by Joi schemas in validation.ts
 */

// Common user object schema for responses
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    email: { type: 'string', example: 'john.doe@example.com' },
    name: { type: 'string', example: 'John Doe' },
    age: { type: 'integer', example: 30 },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

// Standard response wrappers
const successResponse = (
  data: Record<string, unknown>,
  description: string,
  statusCode: number = 200
) => ({
  [statusCode]: {
    description,
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data,
      message: { type: 'string', example: description },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
});

const errorResponse = (description: string, statusCode: number) => ({
  [statusCode]: {
    description,
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
          statusCode: { type: 'integer' },
          details: { type: 'object' },
        },
      },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
});

// Request/response schemas for each endpoint
export const createUserSchema = {
  body: {
    type: 'object',
    required: ['email', 'name'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address (must be unique)',
        example: 'john.doe@example.com',
      },
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'User full name',
        example: 'John Doe',
      },
      age: {
        type: 'integer',
        minimum: 1,
        maximum: 150,
        description: 'User age (optional)',
        example: 30,
      },
    },
  },
  response: {
    ...successResponse(userSchema, 'User created successfully', 201),
    ...errorResponse('Validation error', 400),
    ...errorResponse('User already exists', 409),
  },
} as const;

export const getUserByIdSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
    required: ['id'],
  },
  response: {
    ...successResponse(userSchema, 'User retrieved successfully'),
    ...errorResponse('User not found', 404),
  },
} as const;

export const getUsersSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number',
        example: 1,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of items per page',
        example: 10,
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by user status',
        example: true,
      },
      ageMin: {
        type: 'integer',
        minimum: 1,
        maximum: 150,
        description: 'Minimum age filter',
        example: 18,
      },
      ageMax: {
        type: 'integer',
        minimum: 1,
        maximum: 150,
        description: 'Maximum age filter',
        example: 65,
      },
      search: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Search in name and email',
        example: 'john',
      },
    },
  },
  response: {
    200: {
      description: 'Users retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: userSchema,
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 25 },
            totalPages: { type: 'integer', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
        message: { type: 'string', example: 'Users retrieved successfully' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  },
} as const;

export const updateUserSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'User full name',
        example: 'John Smith',
      },
      age: {
        type: 'integer',
        minimum: 1,
        maximum: 150,
        description: 'User age',
        example: 31,
      },
      isActive: {
        type: 'boolean',
        description: 'User active status',
        example: false,
      },
    },
  },
  response: {
    ...successResponse(userSchema, 'User updated successfully'),
    ...errorResponse('User not found', 404),
  },
} as const;

export const deleteUserSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
    required: ['id'],
  },
  response: {
    204: {
      description: 'User deleted successfully',
      type: 'null',
    },
    ...errorResponse('User not found', 404),
  },
} as const;
