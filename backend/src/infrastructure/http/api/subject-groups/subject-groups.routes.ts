import { createRoute, z } from '@hono/zod-openapi';
import { SubjectGroupSchema, CreateSubjectGroupSchema, OrgAndSubjectIdParamSchema } from '@tfg-horarios/shared';

export const listSubjectGroupsRoute = createRoute({
  method: 'get',
  path: '/{subjectId}/groups',
  request: {
    params: OrgAndSubjectIdParamSchema,
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
    params: OrgAndSubjectIdParamSchema,
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
