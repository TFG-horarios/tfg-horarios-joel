import { createRoute, z } from '@hono/zod-openapi';
import { SubjectGroupSchema, CreateSubjectGroupSchema } from '@tfg-horarios/shared';

const ParamsSchema = z.object({
  subjectId: z.string().uuid().openapi({
    param: {
      name: 'subjectId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const listSubjectGroupsRoute = createRoute({
  method: 'get',
  path: '/{subjectId}/groups',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(SubjectGroupSchema),
        },
      },
      description: 'List all groups for a subject',
    },
  },
});

export const createSubjectGroupRoute = createRoute({
  method: 'post',
  path: '/{subjectId}/groups',
  request: {
    params: ParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: CreateSubjectGroupSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: SubjectGroupSchema,
        },
      },
      description: 'The created subject group',
    },
    400: {
      description: 'Bad request (validation error)',
    },
  },
});
