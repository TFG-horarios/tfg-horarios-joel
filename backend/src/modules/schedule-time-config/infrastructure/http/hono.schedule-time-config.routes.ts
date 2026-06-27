import { createRoute, z } from '@hono/zod-openapi';
import {
  SaveScheduleTimeConfigBodySchema,
  ScheduleTimeConfigListQuerySchema,
  ScheduleTimeConfigSchema,
  UpdateScheduleTimeConfigBodySchema,
  ScheduleTimeConfigPossibilitySchema,
} from '@tfg-horarios/shared';

const baseParams = z.object({
  organizationId: z.uuid(),
  academicYearId: z.uuid(),
});
const idParams = baseParams.extend({ id: z.uuid() });

export const listTimeConfigsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs',
  request: { params: baseParams, query: ScheduleTimeConfigListQuerySchema },
  responses: {
    200: {
      description: 'Time configurations',
      content: {
        'application/json': { schema: z.array(ScheduleTimeConfigSchema) },
      },
    },
  },
});

export const createTimeConfigRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs',
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
  },
});

export const updateTimeConfigRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/{id}',
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
  },
});

export const deleteTimeConfigRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/{id}',
  request: { params: idParams },
  responses: { 204: { description: 'Deleted' } },
});

export const getPossibilitiesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years/{academicYearId}/time-configs/possibilities',
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
  },
});
