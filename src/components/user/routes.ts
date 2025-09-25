import { FastifyInstance } from 'fastify';
import { UserController } from './controller';
import {
  createUserRequestSchema,
  getUserByIdRequestSchema,
  getUsersRequestSchema,
  updateUserRequestSchema,
  deleteUserRequestSchema,
} from './schema';

export const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // OpenAPI tags for Swagger documentation
  const tags = ['Users'];

  // Create user
  fastify.post('/users', {
    schema: {
      tags,
      summary: 'Create a new user',
      description: 'Creates a new user with the provided information',
      ...createUserRequestSchema,
    },
    handler: UserController.create,
  });

  // Get user by ID
  fastify.get('/users/:id', {
    schema: {
      tags,
      summary: 'Get user by ID',
      description: 'Retrieves a user by their unique identifier',
      ...getUserByIdRequestSchema,
    },
    handler: UserController.getById,
  });

  // Get users with filtering and pagination
  fastify.get('/users', {
    schema: {
      tags,
      summary: 'Get users with filtering and pagination',
      description: 'Retrieves users with optional filtering and pagination',
      ...getUsersRequestSchema,
    },
    handler: UserController.getMany,
  });

  // Update user
  fastify.put('/users/:id', {
    schema: {
      tags,
      summary: 'Update user',
      description: 'Updates an existing user with the provided information',
      ...updateUserRequestSchema,
    },
    handler: UserController.update,
  });

  // Delete user
  fastify.delete('/users/:id', {
    schema: {
      tags,
      summary: 'Delete user',
      description: 'Deletes an existing user',
      ...deleteUserRequestSchema,
    },
    handler: UserController.delete,
  });
};
