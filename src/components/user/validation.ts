import Joi from 'joi';

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
