import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SubjectSchema,
  SubjectListParamSchema,
  SubjectCreateParamSchema,
  SubjectIdParamSchema,
  SaveSubjectBodySchema,
} from '@tfg-horarios/shared';

export const listSubjectsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subjects',
  request: { params: SubjectListParamSchema },
  responses: {
    200: {
      description: 'Subjects list',
      content: { 'application/json': { schema: z.array(SubjectSchema) } },
    },
  },
});

export const getSubjectRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects/{id}',
  request: { params: SubjectIdParamSchema },
  responses: {
    200: {
      description: 'Subject detail',
      content: { 'application/json': { schema: SubjectSchema } },
    },
    404: { description: 'Not found' },
  },
});

export const createSubjectRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects',
  request: {
    params: SubjectCreateParamSchema,
    body: {
      content: { 'application/json': { schema: SaveSubjectBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Subject created',
      content: { 'application/json': { schema: SubjectSchema } },
    },
  },
});

export const bulkCreateSubjectsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects/bulk',
  request: {
    params: SubjectCreateParamSchema,
    body: {
      content: {
        'application/json': { schema: z.array(SaveSubjectBodySchema) },
      },
    },
  },
  responses: {
    201: {
      description: 'Subjects bulk created',
      content: { 'application/json': { schema: z.array(SubjectSchema) } },
    },
  },
});

export const updateSubjectRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects/{id}',
  request: {
    params: SubjectIdParamSchema,
    body: {
      content: { 'application/json': { schema: SaveSubjectBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Subject updated',
      content: { 'application/json': { schema: SubjectSchema } },
    },
    404: { description: 'Not found' },
  },
});

export const deleteSubjectRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects/{id}',
  request: { params: SubjectIdParamSchema },
  responses: { 204: { description: 'Deleted' } },
});
