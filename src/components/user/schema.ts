import Joi from 'joi';

// Joi validation schemas for request validation
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  age: Joi.number().integer().min(1).max(150).optional().messages({
    'number.min': 'Age must be at least 1',
    'number.max': 'Age must not exceed 150',
    'number.integer': 'Age must be an integer',
  }),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
  age: Joi.number().integer().min(1).max(150).optional().allow(null).messages({
    'number.min': 'Age must be at least 1',
    'number.max': 'Age must not exceed 150',
    'number.integer': 'Age must be an integer',
  }),
  isActive: Joi.boolean().optional(),
});

export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
    'number.integer': 'Page must be an integer',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
    'number.integer': 'Limit must be an integer',
  }),
  isActive: Joi.boolean().optional(),
  ageMin: Joi.number().integer().min(1).max(150).optional().messages({
    'number.min': 'Minimum age must be at least 1',
    'number.max': 'Minimum age must not exceed 150',
    'number.integer': 'Minimum age must be an integer',
  }),
  ageMax: Joi.number().integer().min(1).max(150).optional().messages({
    'number.min': 'Maximum age must be at least 1',
    'number.max': 'Maximum age must not exceed 150',
    'number.integer': 'Maximum age must be an integer',
  }),
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term must not exceed 100 characters',
  }),
});

export const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.positive': 'User ID must be a positive number',
    'number.integer': 'User ID must be an integer',
    'any.required': 'User ID is required',
  }),
});

// OpenAPI schema definitions that reference centralized response types

// User entity schema for OpenAPI
const userEntitySchema = {
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

// Request body schemas for OpenAPI
export const createUserRequestSchema = {
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
    201: {
      description: 'User created successfully',
      ...getApiResponseSchema(userEntitySchema),
    },
    400: getErrorResponseSchema('Validation error'),
    409: getErrorResponseSchema('User already exists'),
  },
} as const;

export const getUserByIdRequestSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
  },
  response: {
    200: {
      description: 'User retrieved successfully',
      ...getApiResponseSchema(userEntitySchema),
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

export const getUsersRequestSchema = {
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
      ...getPaginatedResponseSchema(userEntitySchema),
    },
  },
} as const;

export const updateUserRequestSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
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
    200: {
      description: 'User updated successfully',
      ...getApiResponseSchema(userEntitySchema),
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

export const deleteUserRequestSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        description: 'User ID',
        example: 1,
      },
    },
  },
  response: {
    204: {
      description: 'User deleted successfully',
      type: 'null',
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

// Centralized response schema helpers to avoid duplication
function getApiResponseSchema(dataSchema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  };
}

function getPaginatedResponseSchema(itemSchema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: itemSchema,
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
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  };
}

function getErrorResponseSchema(description: string) {
  return {
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
  };
}
