import { createRoute } from '@hono/zod-openapi';
import {
  SaveUserBodySchema,
  UserSchema,
  UpdatePasswordBodySchema,
} from '@tfg-horarios/shared';

export const getMeRoute = createRoute({
  method: 'get',
  path: '/users/me',
  responses: {
    200: {
      description: 'User found',
      content: { 'application/json': { schema: UserSchema } },
    },
    401: { description: 'Unauthorized' },
  },
});

export const updateMeRoute = createRoute({
  method: 'patch',
  path: '/users/me',
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
  },
});

export const updatePasswordRoute = createRoute({
  method: 'patch',
  path: '/users/me/password',
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
  },
});

export const deleteMeRoute = createRoute({
  method: 'delete',
  path: '/users/me',
  responses: {
    204: {
      description: 'User deleted successfully',
    },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
  },
});
