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
      description: 'Organización creada exitosamente',
      content: {
        'application/json': { schema: OrganizationSchema },
      },
    },
    400: { description: 'Error de validación o reglas de negocio' },
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
      description: 'Organización obtenida exitosamente',
      content: {
        'application/json': { schema: OrganizationSchema },
      },
    },
    404: { description: 'Organización no encontrada' },
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
    400: { description: 'Error' },
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
    400: { description: 'Error' },
  },
});
