import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SaveOrganizationBodySchema,
  OrganizationIdParamSchema,
  OrganizationSchema,
} from '@tfg-horarios/shared';

export const createOrgRoute = createRoute({
  method: 'post',
  path: '/organizations',
  request: {
    body: {
      content: {
        'application/json': { schema: SaveOrganizationBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Organization created successfully',
      content: {
        'application/json': { schema: OrganizationSchema },
      },
    },
    400: { description: 'Validation or business rule error' },
    401: { description: 'Unauthorized' },
  },
});

export const getOrgRoute = createRoute({
  method: 'get',
  path: '/organizations/{id}',
  request: {
    params: OrganizationIdParamSchema,
  },
  responses: {
    200: {
      description: 'Organization retrieved successfully',
      content: {
        'application/json': { schema: OrganizationSchema },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Organization not found' },
  },
});

export const listOrgRoute = createRoute({
  method: 'get',
  path: '/organizations',
  responses: {
    200: {
      description: 'Listado de organizaciones',
      content: {
        'application/json': { schema: z.array(OrganizationSchema) },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
  },
});

export const updateOrgRoute = createRoute({
  method: 'patch',
  path: '/organizations/{id}',
  request: {
    params: OrganizationIdParamSchema,
    body: {
      content: { 'application/json': { schema: SaveOrganizationBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Organization updated successfully',
      content: { 'application/json': { schema: OrganizationSchema } },
    },
    400: { description: 'Bad Request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Organization not found' },
  },
});

export const deleteOrgRoute = createRoute({
  method: 'delete',
  path: '/organizations/{id}',
  request: {
    params: OrganizationIdParamSchema,
  },
  responses: {
    204: {
      description: 'Organization deleted successfully (No Content)',
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Organization not found' },
  },
});
