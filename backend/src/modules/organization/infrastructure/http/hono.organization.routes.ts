import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateOrganizationSchema,
  OrganizationIdParamSchema,
  OrganizationSchema,
} from '@tfg-horarios/shared';

export const createOrgRoute = createRoute({
  method: 'post',
  path: '/organizations',
  request: {
    body: {
      content: {
        'application/json': { schema: CreateOrganizationSchema },
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
