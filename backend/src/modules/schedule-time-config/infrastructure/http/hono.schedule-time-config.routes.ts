import { createRoute, z } from '@hono/zod-openapi';
import {
  SaveScheduleTimeConfigBodySchema,
  ScheduleTimeConfigListQuerySchema,
  ScheduleTimeConfigSchema,
  UpdateScheduleTimeConfigBodySchema,
  ScheduleTimeConfigPossibilitySchema,
} from '@tfg-horarios/shared';

const tags = ['Schedule Time Configs'];

const baseParams = z.object({
  organizationId: z.uuid(),
  academicYearId: z.uuid(),
});
const idParams = baseParams.extend({ id: z.uuid() });

export const listTimeConfigsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs',
  tags,
  request: { params: baseParams, query: ScheduleTimeConfigListQuerySchema },
  responses: {
    200: {
      description: 'Time configurations',
      content: {
        'application/json': { schema: z.array(ScheduleTimeConfigSchema) },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    500: { description: 'Internal server error' },
  },
});

export const createTimeConfigRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs',
  tags,
  request: {
    params: baseParams,
    body: {
      content: {
        'application/json': { schema: SaveScheduleTimeConfigBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: { 'application/json': { schema: ScheduleTimeConfigSchema } },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    500: { description: 'Internal server error' },
  },
});

export const updateTimeConfigRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/{id}',
  tags,
  request: {
    params: idParams,
    body: {
      content: {
        'application/json': { schema: UpdateScheduleTimeConfigBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated',
      content: { 'application/json': { schema: ScheduleTimeConfigSchema } },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    409: { description: 'Conflict' },
    500: { description: 'Internal server error' },
  },
});

export const deleteTimeConfigRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/{id}',
  tags,
  request: { params: idParams },
  responses: {
    204: { description: 'Deleted' },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
});

export const getPossibilitiesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/possibilities',
  tags,
  request: { params: baseParams },
  responses: {
    200: {
      description: 'Time configuration possibilities',
      content: {
        'application/json': {
          schema: z.array(ScheduleTimeConfigPossibilitySchema),
        },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
});
