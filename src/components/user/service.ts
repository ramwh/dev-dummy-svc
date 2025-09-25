import { RowDataPacket, ResultSetHeader } from 'mysql2';
import DatabaseConnection from '@/database/connection';
import CacheManager from '@/cache/manager';
import { User, CreateUserInput, UpdateUserInput, UserFilters, PaginationParams } from './types';
import { NotFoundError, AlreadyExistsError, DatabaseError } from '@/utils/errors';
import { loggers } from '@/utils/logger';

export class UserService {
  private static readonly CACHE_PREFIX = 'user:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  static async create(input: CreateUserInput): Promise<User> {
    loggers.user.info({ input }, 'Creating new user');

    // Check if user already exists
    const existingUser = await this.findByEmail(input.email);
    if (existingUser) {
      throw new AlreadyExistsError('User', 'email', input.email);
    }

    const sql = `
      INSERT INTO users (email, name, age, is_active, created_at, updated_at)
      VALUES (?, ?, ?, true, NOW(), NOW())
    `;

    try {
      const result = await DatabaseConnection.query<ResultSetHeader>(sql, [
        input.email,
        input.name,
        input.age || null,
      ]);

      const userId = result.insertId;
      const user = await this.findById(userId);

      if (!user) {
        throw new DatabaseError('Failed to retrieve created user');
      }

      // Cache the new user
      await this.cacheUser(user);

      loggers.user.info({ userId }, 'User created successfully');
      return user;
    } catch (error) {
      if (error instanceof AlreadyExistsError || error instanceof DatabaseError) {
        throw error;
      }
      loggers.user.error({ input, error }, 'Failed to create user');
      throw new DatabaseError('Failed to create user');
    }
  }

  static async findById(id: number): Promise<User | null> {
    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    try {
      const cachedUser = await CacheManager.get<User>(cacheKey);
      if (cachedUser) {
        loggers.user.debug({ id }, 'User found in cache');
        return cachedUser;
      }
    } catch (error) {
      loggers.user.warn({ id, error }, 'Cache lookup failed, falling back to database');
    }

    const sql = `
      SELECT id, email, name, age, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE id = ?
    `;

    try {
      const rows = await DatabaseConnection.query<RowDataPacket[]>(sql, [id], true);

      if (rows.length === 0) {
        return null;
      }

      const user = this.mapRowToUser(rows[0]);

      // Cache the user
      await this.cacheUser(user);

      return user;
    } catch (error) {
      loggers.user.error({ id, error }, 'Failed to find user by ID');
      throw new DatabaseError(`Failed to find user with ID: ${id}`);
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT id, email, name, age, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE email = ?
    `;

    try {
      const rows = await DatabaseConnection.query<RowDataPacket[]>(sql, [email], true);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return this.mapRowToUser(row);
    } catch (error) {
      loggers.user.error({ email, error }, 'Failed to find user by email');
      throw new DatabaseError(`Failed to find user with email: ${email}`);
    }
  }

  static async findMany(
    filters: UserFilters,
    pagination: PaginationParams
  ): Promise<{ users: User[]; total: number }> {
    loggers.user.info({ filters, pagination }, 'Finding users with filters');

    const conditions: string[] = [];
    const values: unknown[] = [];

    // Build WHERE conditions
    if (filters.isActive !== undefined) {
      conditions.push('is_active = ?');
      values.push(filters.isActive);
    }

    if (filters.ageMin !== undefined) {
      conditions.push('age >= ?');
      values.push(filters.ageMin);
    }

    if (filters.ageMax !== undefined) {
      conditions.push('age <= ?');
      values.push(filters.ageMax);
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countRows = await DatabaseConnection.query<RowDataPacket[]>(countSql, values, true);
      const total = (countRows[0] as { total: number } | undefined)?.total ?? 0;

      // Get users with pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const usersSql = `
        SELECT id, email, name, age, is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const usersRows = await DatabaseConnection.query<RowDataPacket[]>(
        usersSql,
        [...values, pagination.limit, offset],
        true
      );

      const users = usersRows.map(row => this.mapRowToUser(row));

      return { users, total };
    } catch (error) {
      loggers.user.error({ filters, pagination, error }, 'Failed to find users');
      throw new DatabaseError('Failed to retrieve users');
    }
  }

  static async update(id: number, input: UpdateUserInput): Promise<User> {
    loggers.user.info({ id, input }, 'Updating user');

    // Check if user exists
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User', id);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }

    if (input.age !== undefined) {
      updates.push('age = ?');
      values.push(input.age);
    }

    if (input.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(input.isActive);
    }

    if (updates.length === 0) {
      return existingUser; // No updates needed
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    try {
      await DatabaseConnection.query(sql, values);

      // Invalidate cache
      await this.invalidateUserCache(id);

      // Return updated user
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new DatabaseError('Failed to retrieve updated user');
      }

      loggers.user.info({ id }, 'User updated successfully');
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      loggers.user.error({ id, input, error }, 'Failed to update user');
      throw new DatabaseError(`Failed to update user with ID: ${id}`);
    }
  }

  static async delete(id: number): Promise<void> {
    loggers.user.info({ id }, 'Deleting user');

    // Check if user exists
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User', id);
    }

    const sql = 'DELETE FROM users WHERE id = ?';

    try {
      await DatabaseConnection.query(sql, [id]);

      // Invalidate cache
      await this.invalidateUserCache(id);

      loggers.user.info({ id }, 'User deleted successfully');
    } catch (error) {
      loggers.user.error({ id, error }, 'Failed to delete user');
      throw new DatabaseError(`Failed to delete user with ID: ${id}`);
    }
  }

  private static mapRowToUser(row: RowDataPacket): User {
    return {
      id: row.id as number,
      email: row.email as string,
      name: row.name as string,
      age: row.age ? (row.age as number) : undefined,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }

  private static async cacheUser(user: User): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${user.id}`;
      await CacheManager.set(cacheKey, user, this.CACHE_TTL);
    } catch (error) {
      loggers.user.warn({ userId: user.id, error }, 'Failed to cache user');
    }
  }

  private static async invalidateUserCache(id: number): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      await CacheManager.del(cacheKey);
    } catch (error) {
      loggers.user.warn({ id, error }, 'Failed to invalidate user cache');
    }
  }
}
