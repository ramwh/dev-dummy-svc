import { FastifyInstance } from 'fastify';
import { UserController } from './controller';

export const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // OpenAPI tags for Swagger documentation
  const tags = ['Users'];

  // Create user
  fastify.post('/users', {
    schema: {
      tags,
      summary: 'Create a new user',
      description: 'Creates a new user with the provided information',
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
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
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
            },
            message: { type: 'string', example: 'User created successfully' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          description: 'Validation error',
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
        409: {
          description: 'User already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: "User with email 'john.doe@example.com' already exists",
                },
                code: { type: 'string', example: 'ALREADY_EXISTS' },
                statusCode: { type: 'integer', example: 409 },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: UserController.create,
  });

  // Get user by ID
  fastify.get('/users/:id', {
    schema: {
      tags,
      summary: 'Get user by ID',
      description: 'Retrieves a user by their unique identifier',
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
        200: {
          description: 'User retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
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
            },
            message: { type: 'string', example: 'User retrieved successfully' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          description: 'User not found',
        },
      },
    },
    handler: UserController.getById,
  });

  // Get users with filtering and pagination
  fastify.get('/users', {
    schema: {
      tags,
      summary: 'Get users with filtering and pagination',
      description: 'Retrieves users with optional filtering and pagination',
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
              items: {
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
              },
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
    },
    handler: UserController.getMany,
  });

  // Update user
  fastify.put('/users/:id', {
    schema: {
      tags,
      summary: 'Update user',
      description: 'Updates an existing user with the provided information',
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
        200: {
          description: 'User updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', example: 'john.doe@example.com' },
                name: { type: 'string', example: 'John Smith' },
                age: { type: 'integer', example: 31 },
                isActive: { type: 'boolean', example: false },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            message: { type: 'string', example: 'User updated successfully' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          description: 'User not found',
        },
      },
    },
    handler: UserController.update,
  });

  // Delete user
  fastify.delete('/users/:id', {
    schema: {
      tags,
      summary: 'Delete user',
      description: 'Deletes an existing user',
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
        404: {
          description: 'User not found',
        },
      },
    },
    handler: UserController.delete,
  });
};
