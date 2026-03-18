import { createRoute, z } from '@hono/zod-openapi';
import { UserSchema, CreateUserSchema } from '@tfg-horarios/shared';

export const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(UserSchema),
        },
      },
      description: 'List all users',
    },
  },
});

export const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'The created user',
    },
    400: {
      description: 'Bad request (validation error)',
    },
  },
});
