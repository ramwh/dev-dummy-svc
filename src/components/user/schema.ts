import Joi from 'joi';

// ================================================================================================
// JOI VALIDATION SCHEMAS - Used for request/response validation
// ================================================================================================

// Shared field schemas for consistency
const emailJoiField = Joi.string().email().required().messages({
  'string.email': 'Email must be a valid email address',
  'any.required': 'Email is required',
});

const nameJoiField = Joi.string().min(2).max(100).messages({
  'string.min': 'Name must be at least 2 characters long',
  'string.max': 'Name must not exceed 100 characters',
});

const ageJoiField = Joi.number().integer().min(1).max(150).messages({
  'number.min': 'Age must be at least 1',
  'number.max': 'Age must not exceed 150',
  'number.integer': 'Age must be an integer',
});

const userIdJoiField = Joi.number().integer().positive().required().messages({
  'number.positive': 'User ID must be a positive number',
  'number.integer': 'User ID must be an integer',
  'any.required': 'User ID is required',
});

// Create User Schema
export const createUserJoiSchema = Joi.object({
  email: emailJoiField,
  name: nameJoiField.required().messages({
    'any.required': 'Name is required',
  }),
  age: ageJoiField.optional(),
});

// Create User TypeScript Interface
export interface CreateUserPayload {
  email: string;
  name: string;
  age?: number;
}

// Update User Schema
export const updateUserJoiSchema = Joi.object({
  name: nameJoiField.optional(),
  age: ageJoiField.optional().allow(null),
  isActive: Joi.boolean().optional(),
});

// Update User TypeScript Interface
export interface UpdateUserPayload {
  name?: string;
  age?: number | null;
  isActive?: boolean;
}

// Get Users Query Schema
export const getUsersJoiSchema = Joi.object({
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
  ageMin: ageJoiField.optional().messages({
    'number.min': 'Minimum age must be at least 1',
    'number.max': 'Minimum age must not exceed 150',
    'number.integer': 'Minimum age must be an integer',
  }),
  ageMax: ageJoiField.optional().messages({
    'number.min': 'Maximum age must be at least 1',
    'number.max': 'Maximum age must not exceed 150',
    'number.integer': 'Maximum age must be an integer',
  }),
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term must not exceed 100 characters',
  }),
});

// Get Users Query TypeScript Interface
export interface GetUsersQueryPayload {
  page?: number;
  limit?: number;
  isActive?: boolean;
  ageMin?: number;
  ageMax?: number;
  search?: string;
}

// User ID Param Schema
export const userIdParamJoiSchema = Joi.object({
  id: userIdJoiField,
});

// User ID Param TypeScript Interface
export interface UserIdParamPayload {
  id: number;
}

// ================================================================================================
// OPENAPI SCHEMAS - Used for Swagger documentation and API specifications
// ================================================================================================

// Shared OpenAPI field definitions
const userIdOpenApiField = {
  type: 'integer' as const,
  minimum: 1,
  description: 'User ID',
  example: 1,
};

const emailOpenApiField = {
  type: 'string' as const,
  format: 'email' as const,
  description: 'User email address (must be unique)',
  example: 'john.doe@example.com',
};

const nameOpenApiField = {
  type: 'string' as const,
  minLength: 2,
  maxLength: 100,
  description: 'User full name',
  example: 'John Doe',
};

const ageOpenApiField = {
  type: 'integer' as const,
  minimum: 1,
  maximum: 150,
  description: 'User age',
  example: 30,
};

// User entity schema for OpenAPI responses
const userEntityOpenApiSchema = {
  type: 'object' as const,
  properties: {
    id: userIdOpenApiField,
    email: emailOpenApiField,
    name: nameOpenApiField,
    age: { ...ageOpenApiField, description: 'User age (optional)' },
    isActive: { type: 'boolean' as const, example: true, description: 'User active status' },
    createdAt: { type: 'string' as const, format: 'date-time' as const },
    updatedAt: { type: 'string' as const, format: 'date-time' as const },
  },
};

// Create User OpenAPI Schema
export const createUserOpenApiSchema = {
  body: {
    type: 'object' as const,
    required: ['email', 'name'],
    properties: {
      email: emailOpenApiField,
      name: nameOpenApiField,
      age: ageOpenApiField,
    },
  },
  response: {
    201: {
      description: 'User created successfully',
      ...getApiResponseSchema(userEntityOpenApiSchema),
    },
    400: getErrorResponseSchema('Validation error'),
    409: getErrorResponseSchema('User already exists'),
  },
} as const;

// Get User By ID OpenAPI Schema
export const getUserByIdOpenApiSchema = {
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: userIdOpenApiField,
    },
  },
  response: {
    200: {
      description: 'User retrieved successfully',
      ...getApiResponseSchema(userEntityOpenApiSchema),
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

// Get Users OpenAPI Schema
export const getUsersOpenApiSchema = {
  querystring: {
    type: 'object' as const,
    properties: {
      page: {
        type: 'integer' as const,
        minimum: 1,
        default: 1,
        description: 'Page number',
        example: 1,
      },
      limit: {
        type: 'integer' as const,
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of items per page',
        example: 10,
      },
      isActive: {
        type: 'boolean' as const,
        description: 'Filter by user status',
        example: true,
      },
      ageMin: {
        ...ageOpenApiField,
        description: 'Minimum age filter',
        example: 18,
      },
      ageMax: {
        ...ageOpenApiField,
        description: 'Maximum age filter',
        example: 65,
      },
      search: {
        type: 'string' as const,
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
      ...getPaginatedResponseSchema(userEntityOpenApiSchema),
    },
  },
} as const;

// Update User OpenAPI Schema
export const updateUserOpenApiSchema = {
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: userIdOpenApiField,
    },
  },
  body: {
    type: 'object' as const,
    properties: {
      name: { ...nameOpenApiField, example: 'John Smith' },
      age: { ...ageOpenApiField, example: 31 },
      isActive: {
        type: 'boolean' as const,
        description: 'User active status',
        example: false,
      },
    },
  },
  response: {
    200: {
      description: 'User updated successfully',
      ...getApiResponseSchema(userEntityOpenApiSchema),
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

// Delete User OpenAPI Schema
export const deleteUserOpenApiSchema = {
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: userIdOpenApiField,
    },
  },
  response: {
    204: {
      description: 'User deleted successfully',
      type: 'null' as const,
    },
    404: getErrorResponseSchema('User not found'),
  },
} as const;

// ================================================================================================
// CENTRALIZED OPENAPI RESPONSE HELPERS - Reusable response schema builders
// ================================================================================================

/**
 * Creates a standard API response schema wrapper for successful responses
 * @param dataSchema - The schema for the data field
 * @returns OpenAPI schema object for successful responses
 */
function getApiResponseSchema(dataSchema: Record<string, unknown>) {
  return {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean' as const, example: true },
      data: dataSchema,
      message: { type: 'string' as const },
      timestamp: { type: 'string' as const, format: 'date-time' as const },
    },
  };
}

/**
 * Creates a paginated response schema wrapper for list endpoints
 * @param itemSchema - The schema for individual items in the array
 * @returns OpenAPI schema object for paginated responses
 */
function getPaginatedResponseSchema(itemSchema: Record<string, unknown>) {
  return {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean' as const, example: true },
      data: {
        type: 'array' as const,
        items: itemSchema,
      },
      pagination: {
        type: 'object' as const,
        properties: {
          page: { type: 'integer' as const, example: 1 },
          limit: { type: 'integer' as const, example: 10 },
          total: { type: 'integer' as const, example: 25 },
          totalPages: { type: 'integer' as const, example: 3 },
          hasNext: { type: 'boolean' as const, example: true },
          hasPrev: { type: 'boolean' as const, example: false },
        },
      },
      message: { type: 'string' as const },
      timestamp: { type: 'string' as const, format: 'date-time' as const },
    },
  };
}

/**
 * Creates a standard error response schema for failed requests
 * @param description - Description of the error scenario
 * @returns OpenAPI schema object for error responses
 */
function getErrorResponseSchema(description: string) {
  return {
    description,
    type: 'object' as const,
    properties: {
      success: { type: 'boolean' as const, example: false },
      error: {
        type: 'object' as const,
        properties: {
          message: { type: 'string' as const },
          code: { type: 'string' as const },
          statusCode: { type: 'integer' as const },
          details: { type: 'object' as const },
        },
      },
      timestamp: { type: 'string' as const, format: 'date-time' as const },
    },
  };
}

// ================================================================================================
// BACKWARD COMPATIBILITY EXPORTS - Maintain existing API until migration is complete
// ================================================================================================

// Legacy Joi schema exports (can be removed once all code is updated)
export const createUserSchema = createUserJoiSchema;
export const updateUserSchema = updateUserJoiSchema;
export const getUsersQuerySchema = getUsersJoiSchema;
export const userIdParamSchema = userIdParamJoiSchema;

// Legacy OpenAPI schema exports (can be removed once routes are updated)
export const createUserRequestSchema = createUserOpenApiSchema;
export const getUserByIdRequestSchema = getUserByIdOpenApiSchema;
export const getUsersRequestSchema = getUsersOpenApiSchema;
export const updateUserRequestSchema = updateUserOpenApiSchema;
export const deleteUserRequestSchema = deleteUserOpenApiSchema;
