import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  DegreeSchema,
  CreateAndListDegreeParamsSchema,
  GetDeleteAndUpdateDegreeIdParamSchema,
  CreateAndUpdateDegreeBodySchema,
} from '@tfg-horarios/shared';

export const listDegreesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees',
  request: { params: CreateAndListDegreeParamsSchema },
  responses: {
    200: {
      description: 'Listado de grados',
      content: { 'application/json': { schema: z.array(DegreeSchema) } },
    },
  },
});

export const getDegreeRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees/{degreeId}',
  request: { params: GetDeleteAndUpdateDegreeIdParamSchema },
  responses: {
    200: {
      description: 'Detalle del grado',
      content: { 'application/json': { schema: DegreeSchema } },
    },
    404: { description: 'Grado no encontrado' },
  },
});

export const createDegreeRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees',
  request: {
    params: CreateAndListDegreeParamsSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateDegreeBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Grado creado',
      content: { 'application/json': { schema: DegreeSchema } },
    },
  },
});

export const bulkCreateDegreesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/bulk',
  request: {
    params: CreateAndListDegreeParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(CreateAndUpdateDegreeBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Grados creados masivamente',
      content: { 'application/json': { schema: z.array(DegreeSchema) } },
    },
  },
});

export const updateDegreeRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/degrees/{degreeId}',
  request: {
    params: GetDeleteAndUpdateDegreeIdParamSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateDegreeBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Grado actualizado',
      content: { 'application/json': { schema: DegreeSchema } },
    },
  },
});

export const deleteDegreeRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/degrees/{degreeId}',
  request: { params: GetDeleteAndUpdateDegreeIdParamSchema },
  responses: { 204: { description: 'Degree deleted' } },
});
