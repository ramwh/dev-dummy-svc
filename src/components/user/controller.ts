import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './service';
import { ResponseHandler } from '@/utils/response';
import { ValidationError } from '@/utils/errors';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  PaginationParams,
  UserIdParams,
  GetUsersQuery,
} from './types';
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from './schema';
import { loggers } from '@/utils/logger';

export class UserController {
  static async create(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      // Validate request body
      const { error, value } = createUserSchema.validate(request.body);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Invalid input', {
          field: error.details[0]?.path.join('.'),
          value: error.details[0]?.context?.value,
        });
      }

      const input = value as CreateUserInput;
      const user = await UserService.create(input);

      loggers.http.info({ userId: user.id, userEmail: user.email }, 'User created via API');

      return ResponseHandler.ok(reply, user, 'User created successfully', 201);
    } catch (error) {
      return ResponseHandler.error(reply, error as Error);
    }
  }

  static async getById(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      // Validate request params
      const { error, value } = userIdParamSchema.validate(request.params);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Invalid user ID', {
          field: error.details[0]?.path.join('.'),
          value: error.details[0]?.context?.value,
        });
      }

      const { id } = value as UserIdParams;
      const user = await UserService.findById(id);

      if (!user) {
        return ResponseHandler.fail(reply, 'User not found', 404);
      }

      return ResponseHandler.ok(reply, user, 'User retrieved successfully');
    } catch (error) {
      return ResponseHandler.error(reply, error as Error);
    }
  }

  static async getMany(
    request: FastifyRequest<{ Querystring: GetUsersQuery }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      // Validate query parameters
      const { error, value } = getUsersQuerySchema.validate(request.query);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Invalid query parameters', {
          field: error.details[0]?.path.join('.'),
          value: error.details[0]?.context?.value,
        });
      }

      const { page, limit, ...filters } = value as UserFilters & PaginationParams;
      const pagination: PaginationParams = { page, limit };

      const result = await UserService.findMany(filters, pagination);

      loggers.http.info(
        {
          filters,
          pagination,
          resultCount: result.users.length,
          total: result.total,
        },
        'Users retrieved via API'
      );

      return ResponseHandler.paginated(
        reply,
        result.users,
        page,
        limit,
        result.total,
        'Users retrieved successfully'
      );
    } catch (error) {
      return ResponseHandler.error(reply, error as Error);
    }
  }

  static async update(
    request: FastifyRequest<{ Params: UserIdParams; Body: UpdateUserInput }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      // Validate request params
      const { error: paramError, value: paramValue } = userIdParamSchema.validate(request.params);
      if (paramError) {
        throw new ValidationError(paramError.details[0]?.message || 'Invalid user ID', {
          field: paramError.details[0]?.path.join('.'),
          value: paramError.details[0]?.context?.value,
        });
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateUserSchema.validate(request.body);
      if (bodyError) {
        throw new ValidationError(bodyError.details[0]?.message || 'Invalid input', {
          field: bodyError.details[0]?.path.join('.'),
          value: bodyError.details[0]?.context?.value,
        });
      }

      const { id } = paramValue as UserIdParams;
      const input = bodyValue as UpdateUserInput;

      const user = await UserService.update(id, input);

      loggers.http.info({ userId: id, updates: input }, 'User updated via API');

      return ResponseHandler.ok(reply, user, 'User updated successfully');
    } catch (error) {
      return ResponseHandler.error(reply, error as Error);
    }
  }

  static async delete(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      // Validate request params
      const { error, value } = userIdParamSchema.validate(request.params);
      if (error) {
        throw new ValidationError(error.details[0]?.message || 'Invalid user ID', {
          field: error.details[0]?.path.join('.'),
          value: error.details[0]?.context?.value,
        });
      }

      const { id } = value as UserIdParams;
      await UserService.delete(id);

      loggers.http.info({ userId: id }, 'User deleted via API');

      return ResponseHandler.noContent(reply);
    } catch (error) {
      return ResponseHandler.error(reply, error as Error);
    }
  }
}
