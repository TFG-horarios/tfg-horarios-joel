import { createRoute, z } from '@hono/zod-openapi';
import { SubjectSchema, CreateSubjectSchema, OrgIdParamSchema } from '@tfg-horarios/shared';

export const listSubjectsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/subjects',
  request: {
    params: OrgIdParamSchema,
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
    params: OrgIdParamSchema,
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
