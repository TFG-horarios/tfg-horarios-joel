import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ScheduleSchema,
  ScheduleBaseParamSchema,
  ScheduleIdParamSchema,
  ScheduleSlotSchema,
  SaveScheduleSlotBodySchema,
  GenerationScopeSchema,
  ImportSchedulesBodySchema,
  ImportSchedulesOverwriteSchema,
  ImportSchedulesResultSchema,
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
        'Conflict validation errors during slot movement. Possible error codes (can be multiple separated by \\n):\n- ERR_ROOM_CAPACITY: Classroom capacity is lower than the number of students.\n- ERR_SHIFT_EXCEEDS_DAY: Subject duration exceeds the configured time grid.\n- ERR_BREAK_CROSSING: Subject duration crosses a configured break.\n- ERR_OVERLAP_THEORY: Theory classes for the same students overlap.\n- ERR_OVERLAP_PRACTICES: Practice/Problem classes for the same students overlap.\n- ERR_OVERLAP_SAME_SUBJECT: Two groups of the same subject overlap.\n- ERR_ROOM_OVERLAP: Physical classroom is already occupied at this time.',
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const checkImportSchedulesOverwriteRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/schedules/import/check-overwrite',
  request: {
    params: ScheduleBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: ImportSchedulesBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Schedules and time configurations that will be overwritten',
      content: {
        'application/json': { schema: ImportSchedulesOverwriteSchema },
      },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const importSchedulesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/schedules/import',
  request: {
    params: ScheduleBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: ImportSchedulesBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Schedules and time configurations imported successfully',
      content: {
        'application/json': { schema: ImportSchedulesResultSchema },
      },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const streamScheduleEventsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/schedules/{id}/events',
  request: { params: ScheduleIdParamSchema },
  responses: {
    200: {
      description: 'SSE events stream for a schedule',
      content: {
        'text/event-stream': {
          schema: z.string(),
        },
      },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Schedule not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
