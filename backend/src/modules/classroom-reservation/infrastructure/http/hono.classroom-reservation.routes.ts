import { createRoute } from '@hono/zod-openapi';
import {
  SaveClassroomReservationBodySchema,
  ClassroomReservationSchema,
  ClassroomReservationListQuerySchema,
  UpdateClassroomReservationStatusBodySchema,
  createPaginatedSchema,
  ClassroomReservationBaseParamSchema,
  ClassroomReservationIdParamSchema,
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
  },
});
