import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateOrganizationSchema,
  OrganizationSchema,
} from '@tfg-horarios/shared';

export const createOrgRoute = createRoute({
  method: 'post',
  path: '/',
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
  path: '/',
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
  path: '/{id}',
  responses: {
    200: {
      description: 'Organización eliminada exitosamente',
    },
    400: { description: 'Error' },
  },
});
