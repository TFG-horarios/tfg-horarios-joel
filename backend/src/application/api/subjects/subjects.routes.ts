import { createRoute, z } from '@hono/zod-openapi';
import { SubjectSchema, CreateSubjectSchema } from '@tfg-horarios/shared';

const ParamsSchema = z.object({
  orgId: z.string().uuid().openapi({
    param: {
      name: 'orgId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const listSubjectsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/subjects',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(SubjectSchema),
        },
      },
      description: 'List all subjects for an organization',
    },
  },
});

export const createSubjectRoute = createRoute({
  method: 'post',
  path: '/{orgId}/subjects',
  request: {
    params: ParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: CreateSubjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: SubjectSchema,
        },
      },
      description: 'The created subject',
    },
    400: {
      description: 'Bad request (validation error)',
    },
  },
});
