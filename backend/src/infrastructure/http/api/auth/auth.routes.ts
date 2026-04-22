import { createRoute } from '@hono/zod-openapi';
import {
  LoginSchema,
  AuthResponseSchema,
  RegisterSchema,
} from '@tfg-horarios/shared';

export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
      description: 'Login successful',
    },
    401: {
      description: 'Invalid credentials',
    },
    400: {
      description: 'Bad request',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

export const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
      description: 'User registered successfully',
    },
    400: {
      description: 'Bad request',
    },
    409: {
      description: 'User already exists',
    },
    500: {
      description: 'Internal server error',
    },
  },
});
