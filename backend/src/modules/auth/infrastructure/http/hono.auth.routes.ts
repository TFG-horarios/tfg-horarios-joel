import { createRoute } from '@hono/zod-openapi';
import {
  AuthResponseSchema,
  LoginSchema,
  RegisterSchema,
} from '@tfg-horarios/shared';

export const loginRoute = createRoute({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': { schema: LoginSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': { schema: AuthResponseSchema },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Invalid credentials' },
    500: { description: 'Internal server error' },
  },
});

export const registerRoute = createRoute({
  method: 'post',
  path: '/auth/register',
  request: {
    body: {
      content: {
        'application/json': { schema: RegisterSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': { schema: AuthResponseSchema },
      },
    },
    400: { description: 'Validation error' },
    409: { description: 'User already exists' },
    500: { description: 'Internal server error' },
  },
});
