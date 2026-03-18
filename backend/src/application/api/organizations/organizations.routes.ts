import { createRoute, z } from '@hono/zod-openapi';
import {
  OrganizationSchema,
  CreateOrganizationSchema,
} from '@tfg-horarios/shared';

export const listOrganizationsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(OrganizationSchema),
        },
      },
      description: 'List all organizations',
    },
  },
});

export const createOrganizationRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateOrganizationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: OrganizationSchema,
        },
      },
      description: 'The created organization',
    },
    400: {
      description: 'Bad request (validation error)',
    },
  },
});
