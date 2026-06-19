import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ScheduleSchema,
  ScheduleBaseParamSchema,
  ScheduleIdParamSchema,
  ScheduleSlotSchema,
  SaveScheduleSlotBodySchema,
  GenerationScopeSchema,
  ScheduleListQuerySchema,
  createPaginatedSchema,
} from '@tfg-horarios/shared';

export const listSchedulesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules',
  request: {
    params: ScheduleBaseParamSchema,
    query: ScheduleListQuerySchema,
  },
  responses: {
    200: {
      description: 'Listado de horarios',
      content: {
        'application/json': { schema: createPaginatedSchema(ScheduleSchema) },
      },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

export const listAllSchedulesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules/all',
  request: {
    params: ScheduleBaseParamSchema,
  },
  responses: {
    200: {
      description: 'Listado completo de horarios',
      content: {
        'application/json': { schema: z.array(ScheduleSchema) },
      },
    },
    403: { description: 'Forbidden' },
  },
});

export const getScheduleRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules/{id}',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'Schedule details',
      content: { 'application/json': { schema: ScheduleSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
  },
});

export const deleteScheduleRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/schedules/{id}',
  request: { params: ScheduleIdParamSchema },
  responses: {
    204: { description: 'Schedule deleted successfully' },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
  },
});

export const publishScheduleRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/schedules/{id}/publish',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'Schedule published successfully',
      content: { 'application/json': { schema: ScheduleSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
  },
});

export const unpublishScheduleRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/schedules/{id}/unpublish',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'Schedule unpublished successfully',
      content: { 'application/json': { schema: ScheduleSchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
  },
});

export const listScheduleSlotsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules/{id}/slots',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'Schedule slots list',
      content: { 'application/json': { schema: z.array(ScheduleSlotSchema) } },
    },
    404: { description: 'Schedule not found' },
  },
});

const ScheduleSlotRouteParamsSchema = z.object({
  organizationId: z.uuid(),
  id: z.uuid(),
});

export const updateScheduleSlotRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/slots/{id}',
  request: {
    params: ScheduleSlotRouteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: SaveScheduleSlotBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Schedule slot updated successfully',
      content: { 'application/json': { schema: ScheduleSlotSchema } },
    },
    404: { description: 'Schedule slot not found' },
    409: {
      description:
        'Conflict validation errors during slot movement. Possible error codes (can be multiple separated by \\n):\n- ERR_ROOM_CAPACITY: Classroom capacity is lower than the number of students.\n- ERR_SHIFT_MORNING: Subject is forced to morning shift but placed in afternoon.\n- ERR_SHIFT_AFTERNOON: Subject is forced to afternoon shift but placed in morning.\n- ERR_SHIFT_EXCEEDS_DAY: Subject duration exceeds the maximum slots of the day.\n- ERR_OVERLAP_THEORY: Theory classes for the same students overlap.\n- ERR_OVERLAP_PRACTICES: Practice/Problem classes for the same students overlap.\n- ERR_OVERLAP_SAME_SUBJECT: Two groups of the same subject overlap.\n- ERR_ROOM_OVERLAP: Physical classroom is already occupied at this time.',
    },
  },
});

export const generateScheduleRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/schedules/generate',
  request: {
    params: ScheduleBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: GenerationScopeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Schedules generated successfully',
      content: { 'application/json': { schema: z.array(ScheduleSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict: Generation already exists or in progress' },
  },
});

export const checkOverwriteScheduleRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/schedules/check-overwrite',
  request: {
    params: ScheduleBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: GenerationScopeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Schedules that will be overwritten',
      content: { 'application/json': { schema: z.array(ScheduleSchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
  },
});

export const streamScheduleEventsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules/{id}/events',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'SSE events stream for a schedule',
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
  },
});
