import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ClassroomSchema,
  SaveClassroomBodySchema,
  ClassroomBaseParamSchema,
  ClassroomIdParamSchema,
} from '@tfg-horarios/shared';

export const listClassroomsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classrooms',
  request: { params: ClassroomBaseParamSchema },
  responses: {
    200: {
      description: 'Classroom list',
      content: { 'application/json': { schema: z.array(ClassroomSchema) } },
    },
    403: { description: 'Forbidden' },
  },
});

export const getClassroomRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classrooms/{id}',
  request: { params: ClassroomIdParamSchema },
  responses: {
    200: {
      description: 'Classroom found',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Classroom not found' },
  },
});

export const createClassroomRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/classrooms',
  request: {
    params: ClassroomBaseParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveClassroomBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Classroom created',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const createManyClassroomsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/classrooms/bulk',
  request: {
    params: ClassroomBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(SaveClassroomBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Classrooms created',
      content: { 'application/json': { schema: z.array(ClassroomSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const replaceClassroomsRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/classrooms/bulk',
  request: {
    params: ClassroomBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(SaveClassroomBodySchema),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Classrooms replaced',
      content: { 'application/json': { schema: z.array(ClassroomSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
  },
});

export const updateClassroomRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/classrooms/{id}',
  request: {
    params: ClassroomIdParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveClassroomBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Classroom updated',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Classroom not found' },
    409: { description: 'Conflict' },
  },
});

export const deleteClassroomRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/classrooms/{id}',
  request: { params: ClassroomIdParamSchema },
  responses: {
    204: { description: 'Classroom deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Classroom not found' },
  },
});

export const deleteAllClassroomsRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/classrooms',
  request: { params: ClassroomBaseParamSchema },
  responses: {
    204: { description: 'All classrooms deleted' },
    403: { description: 'Forbidden' },
  },
});
