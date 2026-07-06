import { createRoute } from '@hono/zod-openapi';
import {
  AcademicYearSchema,
  SaveAcademicYearBodySchema,
} from '@tfg-horarios/shared';
import { z } from '@hono/zod-openapi';

const tags = ['Academic Years'];

export const createAcademicYearRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/academic-years',
  tags,
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: SaveAcademicYearBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Academic Year created',
      content: {
        'application/json': {
          schema: AcademicYearSchema,
        },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    500: { description: 'Internal server error' },
  },
});

export const listAcademicYearsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years',
  tags,
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'List of academic years',
      content: {
        'application/json': {
          schema: z.array(AcademicYearSchema),
        },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    500: { description: 'Internal server error' },
  },
});

export const updateAcademicYearRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/academic-years/{id}',
  tags,
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: SaveAcademicYearBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Academic Year updated',
      content: {
        'application/json': {
          schema: AcademicYearSchema,
        },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    500: { description: 'Internal server error' },
  },
});

export const deleteAcademicYearRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/academic-years/{id}',
  tags,
  request: {
    params: z.object({
      organizationId: z.uuid(),
      id: z.uuid(),
    }),
  },
  responses: {
    204: {
      description: 'Academic Year deleted',
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
});
