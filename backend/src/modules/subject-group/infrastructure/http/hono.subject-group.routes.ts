import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SubjectGroupSchema,
  SubjectGroupBaseParamSchema,
  SubjectGroupCreateParamSchema,
  SubjectGroupIdParamSchema,
  SaveSubjectGroupBodySchema,
  BulkSaveSubjectGroupBodySchema,
  SubjectGroupIdentifierSchema,
  SubjectGroupListQuerySchema,
  createPaginatedSchema,
  AcademicYearContextQuerySchema,
} from '@tfg-horarios/shared';

const tags = ['Subject Groups'];

export const listSubjectGroupsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups',
  tags,
  request: {
    params: SubjectGroupBaseParamSchema,
    query: SubjectGroupListQuerySchema,
  },
  responses: {
    200: {
      description: 'Listado de grupos',
      content: {
        'application/json': {
          schema: createPaginatedSchema(SubjectGroupSchema),
        },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const listAllSubjectGroupsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups/all',
  tags,
  request: {
    params: SubjectGroupBaseParamSchema,
    query: AcademicYearContextQuerySchema,
  },
  responses: {
    200: {
      description: 'Listado completo de grupos',
      content: {
        'application/json': { schema: z.array(SubjectGroupSchema) },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getSubjectGroupIdentifiersRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups/identifiers',
  tags,
  request: { params: SubjectGroupBaseParamSchema },
  responses: {
    200: {
      description: 'Group identifiers',
      content: {
        'application/json': {
          schema: z.array(SubjectGroupIdentifierSchema),
        },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getSubjectGroupRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups/{id}',
  tags,
  request: { params: SubjectGroupIdParamSchema },
  responses: {
    200: {
      description: 'Group details',
      content: { 'application/json': { schema: SubjectGroupSchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const createSubjectGroupRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/subjects/{subjectId}/groups',
  tags,
  request: {
    params: SubjectGroupCreateParamSchema,
    body: {
      content: { 'application/json': { schema: SaveSubjectGroupBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Group created',
      content: { 'application/json': { schema: SubjectGroupSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const bulkCreateSubjectGroupsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/subject-groups/bulk',
  tags,
  request: {
    params: SubjectGroupBaseParamSchema,
    body: {
      content: {
        'application/json': { schema: z.array(BulkSaveSubjectGroupBodySchema) },
      },
    },
  },
  responses: {
    201: {
      description: 'Groups created in bulk',
      content: { 'application/json': { schema: z.array(SubjectGroupSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const replaceSubjectGroupsRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/subject-groups/bulk',
  tags,
  request: {
    params: SubjectGroupBaseParamSchema,
    body: {
      content: {
        'application/json': { schema: z.array(BulkSaveSubjectGroupBodySchema) },
      },
    },
  },
  responses: {
    200: {
      description: 'Groups replaced',
      content: { 'application/json': { schema: z.array(SubjectGroupSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const updateSubjectGroupRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/subject-groups/{id}',
  tags,
  request: {
    params: SubjectGroupIdParamSchema,
    body: {
      content: { 'application/json': { schema: SaveSubjectGroupBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Group updated',
      content: { 'application/json': { schema: SubjectGroupSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteSubjectGroupRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subject-groups/{id}',
  tags,
  request: { params: SubjectGroupIdParamSchema },
  responses: {
    204: { description: 'Group deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteAllSubjectGroupsRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subject-groups',
  tags,
  request: { params: SubjectGroupBaseParamSchema },
  responses: {
    204: { description: 'All groups deleted' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
