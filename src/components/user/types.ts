export interface User {
  id: number;
  email: string;
  name: string;
  age?: number | undefined;
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
