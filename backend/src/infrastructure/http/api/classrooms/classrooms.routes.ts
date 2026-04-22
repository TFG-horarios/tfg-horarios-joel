import { createRoute, z } from '@hono/zod-openapi';
import { ClassroomSchema, CreateClassroomSchema, OrgIdParamSchema } from '@tfg-horarios/shared';

export const listClassroomsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/classrooms',
  request: {
    params: OrgIdParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(ClassroomSchema),
        },
      },
      description: 'List all classrooms for an organization',
    },
  },
});

export const createClassroomRoute = createRoute({
  method: 'post',
  path: '/{orgId}/classrooms',
  request: {
    params: OrgIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: CreateClassroomSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ClassroomSchema,
        },
      },
      description: 'The created classroom',
    },
    400: {
      description: 'Bad request (validation error)',
    },
  },
});
