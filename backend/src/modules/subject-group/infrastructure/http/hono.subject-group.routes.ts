import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SubjectGroupSchema,
  SubjectGroupBaseParamSchema,
  SubjectGroupCreateParamSchema,
  SubjectGroupIdParamSchema,
  SaveSubjectGroupBodySchema,
  BulkSaveSubjectGroupBodySchema,
} from '@tfg-horarios/shared';

export const listSubjectGroupsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups',
  request: { params: SubjectGroupBaseParamSchema },
  responses: {
    200: {
      description: 'Groups list',
      content: { 'application/json': { schema: z.array(SubjectGroupSchema) } },
    },
    403: { description: 'Forbidden' },
  },
});

export const getSubjectGroupRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/subject-groups/{id}',
  request: { params: SubjectGroupIdParamSchema },
  responses: {
    200: {
      description: 'Group details',
      content: { 'application/json': { schema: SubjectGroupSchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

export const createSubjectGroupRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/subjects/{subjectId}/groups',
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
  },
});

export const bulkCreateSubjectGroupsRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/subject-groups/bulk',
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
  },
});

export const replaceSubjectGroupsRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/subject-groups/bulk',
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
  },
});

export const updateSubjectGroupRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/subject-groups/{id}',
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
  },
});

export const deleteSubjectGroupRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subject-groups/{id}',
  request: { params: SubjectGroupIdParamSchema },
  responses: {
    204: { description: 'Group deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

export const deleteAllSubjectGroupsRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/subject-groups',
  request: { params: SubjectGroupBaseParamSchema },
  responses: {
    204: { description: 'All groups deleted' },
    403: { description: 'Forbidden' },
  },
});
