import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  SaveClassroomReservationBodySchema,
  ClassroomReservationSchema,
  ClassroomReservationListQuerySchema,
  UpdateClassroomReservationStatusBodySchema,
  createPaginatedSchema,
  ClassroomReservationBaseParamSchema,
  ClassroomReservationIdParamSchema,
  ClassroomAvailabilityQuerySchema,
  ClassroomAvailabilityResponseSchema,
} from '@tfg-horarios/shared';

const tags = ['Classroom Reservations'];

export const createReservationRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/classroom-reservations',
  tags,
  request: {
    params: ClassroomReservationBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: SaveClassroomReservationBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Reservation created',
      content: {
        'application/json': {
          schema: ClassroomReservationSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    403: {
      description: 'Forbidden',
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const listReservationsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classroom-reservations',
  tags,
  request: {
    params: ClassroomReservationBaseParamSchema,
    query: ClassroomReservationListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of reservations',
      content: {
        'application/json': {
          schema: createPaginatedSchema(ClassroomReservationSchema),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    500: { description: 'Internal server error' },
  },
});

export const updateReservationStatusRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/classroom-reservations/{id}/status',
  tags,
  request: {
    params: ClassroomReservationIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateClassroomReservationStatusBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reservation status updated',
      content: {
        'application/json': {
          schema: ClassroomReservationSchema,
        },
      },
    },
    400: {
      description: 'Bad request / Conflict',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Not found',
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getAvailabilityRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classroom-reservations/availability',
  tags,
  request: {
    params: ClassroomReservationBaseParamSchema,
    query: ClassroomAvailabilityQuerySchema,
  },
  responses: {
    200: {
      description: 'Classroom availability',
      content: {
        'application/json': {
          schema: ClassroomAvailabilityResponseSchema,
        },
      },
    },
    400: { description: 'Bad request' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
});

export const streamClassroomReservationEventsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/classroom-reservations/classrooms/{classroomId}/events',
  tags,
  request: {
    params: z.object({
      organizationId: z.uuid(),
      classroomId: z.uuid(),
    }),
  },
  responses: {
    200: {
      description: 'SSE events stream for classroom reservations',
      content: {
        'text/event-stream': {
          schema: z.string(),
        },
      },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const cancelReservationRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/classroom-reservations/{id}',
  tags,
  request: {
    params: ClassroomReservationIdParamSchema,
  },
  responses: {
    200: {
      description: 'Reservation cancelled',
      content: {
        'application/json': {
          schema: ClassroomReservationSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Not found',
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
