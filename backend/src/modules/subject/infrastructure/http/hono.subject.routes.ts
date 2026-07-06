import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SubjectSchema,
  SubjectListParamSchema,
  SubjectCreateParamSchema,
  SubjectIdParamSchema,
  SaveSubjectBodySchema,
  BulkSaveSubjectBodySchema,
  SubjectIdentifierSchema,
  SubjectListQuerySchema,
  createPaginatedSchema,
  AcademicYearContextQuerySchema,
} from '@tfg-horarios/shared';

const tags = ['Subjects'];

export const listSubjectsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subjects',
  tags,
  request: {
    params: SubjectListParamSchema,
    query: SubjectListQuerySchema,
  },
  responses: {
    200: {
      description: 'Listado de asignaturas',
      content: {
        'application/json': { schema: createPaginatedSchema(SubjectSchema) },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const listAllSubjectsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subjects/all',
  tags,
  request: {
    params: SubjectListParamSchema,
    query: AcademicYearContextQuerySchema,
  },
  responses: {
    200: {
      description: 'Subjects list',
      content: { 'application/json': { schema: z.array(SubjectSchema) } },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getSubjectIdentifiersRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subjects/identifiers',
  tags,
  request: { params: SubjectListParamSchema },
  responses: {
    200: {
      description: 'Subject identifiers',
      content: {
        'application/json': {
          schema: z.array(SubjectIdentifierSchema),
        },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getSubjectRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subjects/{id}',
  tags,
  request: { params: SubjectIdParamSchema },
  responses: {
    200: {
      description: 'Subject detail',
      content: { 'application/json': { schema: SubjectSchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const createSubjectRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/subjects',
  tags,
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
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const bulkCreateSubjectsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/subjects/bulk',
  tags,
  request: {
    params: SubjectListParamSchema,
    body: {
      content: {
        'application/json': { schema: z.array(BulkSaveSubjectBodySchema) },
      },
    },
  },
  responses: {
    201: {
      description: 'Subjects bulk created',
      content: { 'application/json': { schema: z.array(SubjectSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const replaceSubjectsRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/subjects/bulk',
  tags,
  request: {
    params: SubjectListParamSchema,
    body: {
      content: {
        'application/json': { schema: z.array(BulkSaveSubjectBodySchema) },
      },
    },
  },
  responses: {
    200: {
      description: 'Subjects replaced',
      content: { 'application/json': { schema: z.array(SubjectSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const updateSubjectRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/subjects/{id}',
  tags,
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
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteSubjectRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subjects/{id}',
  tags,
  request: { params: SubjectIdParamSchema },
  responses: {
    204: { description: 'Deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteAllSubjectsRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subjects',
  tags,
  request: { params: SubjectListParamSchema },
  responses: {
    204: { description: 'All subjects deleted' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
