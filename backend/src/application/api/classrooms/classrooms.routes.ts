import { createRoute, z } from '@hono/zod-openapi';
import { ClassroomSchema, CreateClassroomSchema } from '@tfg-horarios/shared';

const ParamsSchema = z.object({
  orgId: z.string().uuid().openapi({
    param: {
      name: 'orgId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const listClassroomsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/classrooms',
  request: {
    params: ParamsSchema,
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
    params: ParamsSchema,
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
