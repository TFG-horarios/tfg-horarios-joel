import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  DegreeSchema,
  DegreeBaseParamSchema,
  DegreeIdParamSchema,
  SaveDegreeBodySchema,
} from '@tfg-horarios/shared';

export const listDegreesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees',
  request: { params: DegreeBaseParamSchema },
  responses: {
    200: {
      description: 'Listado de grados',
      content: { 'application/json': { schema: z.array(DegreeSchema) } },
    },
    403: { description: 'Forbidden' },
  },
});

export const getDegreeRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees/{id}',
  request: { params: DegreeIdParamSchema },
  responses: {
    200: {
      description: 'Detalle del grado',
      content: { 'application/json': { schema: DegreeSchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Grado no encontrado' },
  },
});

export const createDegreeRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees',
  request: {
    params: DegreeBaseParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveDegreeBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Degree created',
      content: { 'application/json': { schema: DegreeSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const bulkCreateDegreesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/bulk',
  request: {
    params: DegreeBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(SaveDegreeBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Degrees created in bulk',
      content: { 'application/json': { schema: z.array(DegreeSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const replaceDegreesRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/degrees/bulk',
  request: {
    params: DegreeBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(SaveDegreeBodySchema),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Degrees replaced',
      content: { 'application/json': { schema: z.array(DegreeSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const updateDegreeRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/degrees/{id}',
  request: {
    params: DegreeIdParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveDegreeBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Degree updated',
      content: { 'application/json': { schema: DegreeSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Grado no encontrado' },
    409: { description: 'Conflict' },
  },
});

export const deleteDegreeRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/degrees/{id}',
  request: { params: DegreeIdParamSchema },
  responses: {
    204: { description: 'Degree deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Grado no encontrado' },
  },
});

export const deleteAllDegreesRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/degrees',
  request: { params: DegreeBaseParamSchema },
  responses: {
    204: { description: 'All degrees deleted' },
    403: { description: 'Forbidden' },
  },
});
