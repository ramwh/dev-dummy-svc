import { UserService } from './service';
import { CreateUserInput, UpdateUserInput, User } from './types';
import { NotFoundError, AlreadyExistsError, DatabaseError } from '@/utils/errors';
import DatabaseConnection from '@/database/connection';
import CacheManager from '@/cache/manager';

// Mock dependencies
jest.mock('@/database/connection');
jest.mock('@/cache/manager');

const mockDatabaseConnection = DatabaseConnection as jest.Mocked<typeof DatabaseConnection>;
const mockCacheManager = CacheManager as jest.Mocked<typeof CacheManager>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
    };

    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    };

    it('should create a user successfully', async () => {
      // Mock findByEmail to return null (user doesn't exist)
      jest.spyOn(UserService, 'findByEmail').mockResolvedValue(null);

      // Mock database query for insertion
      mockDatabaseConnection.query.mockResolvedValueOnce({ insertId: 1 } as any);

      // Mock findById to return the created user
      jest.spyOn(UserService, 'findById').mockResolvedValue(mockUser);

      // Mock cache set
      mockCacheManager.set.mockResolvedValue();

      const result = await UserService.create(createUserInput);

      expect(result).toEqual(mockUser);
      expect(UserService.findByEmail).toHaveBeenCalledWith(createUserInput.email);
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [createUserInput.email, createUserInput.name, createUserInput.age]
      );
      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith('user:1', mockUser, 300);
    });

    it('should throw AlreadyExistsError if user with email already exists', async () => {
      // Mock findByEmail to return existing user
      jest.spyOn(UserService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(UserService.create(createUserInput)).rejects.toThrow(AlreadyExistsError);
      expect(UserService.findByEmail).toHaveBeenCalledWith(createUserInput.email);
      expect(mockDatabaseConnection.query).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError if insertion fails', async () => {
      // Mock findByEmail to return null
      jest.spyOn(UserService, 'findByEmail').mockResolvedValue(null);

      // Mock database query to throw error
      mockDatabaseConnection.query.mockRejectedValue(new Error('Database error'));

      await expect(UserService.create(createUserInput)).rejects.toThrow(DatabaseError);
      expect(UserService.findByEmail).toHaveBeenCalledWith(createUserInput.email);
      expect(mockDatabaseConnection.query).toHaveBeenCalled();
    });

    it('should handle missing age gracefully', async () => {
      const inputWithoutAge: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const userWithoutAge: User = { ...mockUser };
      delete (userWithoutAge as any).age;

      jest.spyOn(UserService, 'findByEmail').mockResolvedValue(null);
      mockDatabaseConnection.query.mockResolvedValueOnce({ insertId: 1 } as any);
      jest.spyOn(UserService, 'findById').mockResolvedValue(userWithoutAge);
      mockCacheManager.set.mockResolvedValue();

      const result = await UserService.create(inputWithoutAge);

      expect(result).toEqual(userWithoutAge);
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [inputWithoutAge.email, inputWithoutAge.name, null]
      );
    });
  });

  describe('findById', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    };

    it('should return user from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);

      const result = await UserService.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:1');
      expect(mockDatabaseConnection.query).not.toHaveBeenCalled();
    });

    it('should query database if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockDatabaseConnection.query.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          age: 30,
          isActive: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ] as any);
      mockCacheManager.set.mockResolvedValue();

      const result = await UserService.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:1');
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1],
        true
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith('user:1', mockUser, 300);
    });

    it('should return null if user not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockDatabaseConnection.query.mockResolvedValue([]);

      const result = await UserService.findById(1);

      expect(result).toBeNull();
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:1');
      expect(mockDatabaseConnection.query).toHaveBeenCalled();
    });

    it('should fallback to database if cache fails', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));
      mockDatabaseConnection.query.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          age: 30,
          isActive: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ] as any);
      mockCacheManager.set.mockResolvedValue();

      const result = await UserService.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseConnection.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    };

    const updateInput: UpdateUserInput = {
      name: 'Updated User',
      age: 35,
    };

    const updatedUser: User = {
      ...mockUser,
      name: 'Updated User',
      age: 35,
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    };

    it('should update user successfully', async () => {
      jest
        .spyOn(UserService, 'findById')
        .mockResolvedValueOnce(mockUser) // First call to check existence
        .mockResolvedValueOnce(updatedUser); // Second call to return updated user

      mockDatabaseConnection.query.mockResolvedValue({} as any);
      mockCacheManager.del.mockResolvedValue(1);

      const result = await UserService.update(1, updateInput);

      expect(result).toEqual(updatedUser);
      expect(UserService.findById).toHaveBeenCalledTimes(2);
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        [updateInput.name, updateInput.age, 1]
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('user:1');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      jest.spyOn(UserService, 'findById').mockResolvedValue(null);

      await expect(UserService.update(1, updateInput)).rejects.toThrow(NotFoundError);
      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(mockDatabaseConnection.query).not.toHaveBeenCalled();
    });

    it('should return existing user if no updates provided', async () => {
      jest.spyOn(UserService, 'findById').mockResolvedValue(mockUser);

      const result = await UserService.update(1, {});

      expect(result).toEqual(mockUser);
      expect(mockDatabaseConnection.query).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateUserInput = { name: 'Partially Updated' };
      const partiallyUpdatedUser: User = {
        ...mockUser,
        name: 'Partially Updated',
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      jest
        .spyOn(UserService, 'findById')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(partiallyUpdatedUser);

      mockDatabaseConnection.query.mockResolvedValue({} as any);
      mockCacheManager.del.mockResolvedValue(1);

      const result = await UserService.update(1, partialUpdate);

      expect(result).toEqual(partiallyUpdatedUser);
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET name = ?'),
        [partialUpdate.name, 1]
      );
    });
  });

  describe('delete', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    };

    it('should delete user successfully', async () => {
      jest.spyOn(UserService, 'findById').mockResolvedValue(mockUser);
      mockDatabaseConnection.query.mockResolvedValue({} as any);
      mockCacheManager.del.mockResolvedValue(1);

      await expect(UserService.delete(1)).resolves.toBeUndefined();

      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(mockDatabaseConnection.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [
        1,
      ]);
      expect(mockCacheManager.del).toHaveBeenCalledWith('user:1');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      jest.spyOn(UserService, 'findById').mockResolvedValue(null);

      await expect(UserService.delete(1)).rejects.toThrow(NotFoundError);
      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(mockDatabaseConnection.query).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError if deletion fails', async () => {
      jest.spyOn(UserService, 'findById').mockResolvedValue(mockUser);
      mockDatabaseConnection.query.mockRejectedValue(new Error('Database error'));

      await expect(UserService.delete(1)).rejects.toThrow(DatabaseError);
      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(mockDatabaseConnection.query).toHaveBeenCalled();
    });
  });
});
