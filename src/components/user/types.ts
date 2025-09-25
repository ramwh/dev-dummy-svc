export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  age?: number;
}

export interface UpdateUserInput {
  name?: string;
  age?: number;
  isActive?: boolean;
}

export interface UserFilters {
  isActive?: boolean;
  ageMin?: number;
  ageMax?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Request parameter types
export interface UserIdParams {
  id: number;
}

export interface GetUsersQuery extends UserFilters, PaginationParams {}

// Response types
export interface UserResponse {
  success: true;
  data: User;
  message?: string;
  timestamp: string;
}

export interface UsersResponse {
  success: true;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}
