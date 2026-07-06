import { createRoute } from '@hono/zod-openapi';
import {
  SaveUserBodySchema,
  UserSchema,
  UpdatePasswordBodySchema,
} from '@tfg-horarios/shared';

const tags = ['Users'];

export const getMeRoute = createRoute({
  method: 'get',
  path: '/users/me',
  tags,
  responses: {
    200: {
      description: 'User found',
      content: { 'application/json': { schema: UserSchema } },
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const updateMeRoute = createRoute({
  method: 'patch',
  path: '/users/me',
  tags,
  request: {
    body: {
      content: {
        'application/json': { schema: SaveUserBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated successfully',
      content: { 'application/json': { schema: UserSchema } },
    },
    400: { description: 'Invalid update data' },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
    500: { description: 'Internal server error' },
  },
});

export const updatePasswordRoute = createRoute({
  method: 'patch',
  path: '/users/me/password',
  tags,
  request: {
    body: {
      content: {
        'application/json': { schema: UpdatePasswordBodySchema },
      },
    },
  },
  responses: {
    204: {
      description: 'Password updated successfully',
    },
    400: { description: 'Invalid update data' },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
    500: { description: 'Internal server error' },
  },
});

export const deleteMeRoute = createRoute({
  method: 'delete',
  path: '/users/me',
  tags,
  responses: {
    204: {
      description: 'User deleted successfully',
    },
    400: { description: 'Invalid delete request' },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
    500: { description: 'Internal server error' },
  },
});
