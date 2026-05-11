import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ClassroomSchema,
  CreateAndUpdateClassroomBodySchema,
  CreateAndListClassroomParamsSchema,
  DeleteGetAndUpdateClassroomParamsSchema,
} from '@tfg-horarios/shared';

export const listClassroomsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classrooms',
  request: { params: CreateAndListClassroomParamsSchema },
  responses: {
    200: {
      description: 'Classroom list',
      content: { 'application/json': { schema: z.array(ClassroomSchema) } },
    },
  },
});

export const getClassroomRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classrooms/{classroomId}',
  request: { params: DeleteGetAndUpdateClassroomParamsSchema },
  responses: {
    200: {
      description: 'Classroom found',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
    404: { description: 'Classroom not found' },
  },
});

export const createClassroomRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/classrooms',
  request: {
    params: CreateAndListClassroomParamsSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateClassroomBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Classroom created',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
  },
});

export const createManyClassroomsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/classrooms/batch',
  request: {
    params: CreateAndListClassroomParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(CreateAndUpdateClassroomBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Classrooms created',
      content: { 'application/json': { schema: z.array(ClassroomSchema) } },
    },
  },
});

export const updateClassroomRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/classrooms/{classroomId}',
  request: {
    params: DeleteGetAndUpdateClassroomParamsSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateClassroomBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Classroom updated',
      content: { 'application/json': { schema: ClassroomSchema } },
    },
  },
});

export const deleteClassroomRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/classrooms/{classroomId}',
  request: { params: DeleteGetAndUpdateClassroomParamsSchema },
  responses: {
    204: { description: 'Classroom deleted' },
  },
});
