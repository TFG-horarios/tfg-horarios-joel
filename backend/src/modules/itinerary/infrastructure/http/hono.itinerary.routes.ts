import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ItinerarySchema,
  ItineraryBaseParamSchema,
  SaveItineraryBodySchema,
  BulkSaveItineraryBodySchema,
  ItineraryIdParamSchema,
  ItineraryCreateParamSchema,
  ItineraryIdentifierSchema,
  ItineraryListQuerySchema,
  createPaginatedSchema,
  AcademicYearContextQuerySchema,
} from '@tfg-horarios/shared';

const tags = ['Itineraries'];

export const listItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries',
  tags,
  request: {
    params: ItineraryBaseParamSchema,
    query: ItineraryListQuerySchema,
  },
  responses: {
    200: {
      description: 'Listado de itinerarios',
      content: {
        'application/json': { schema: createPaginatedSchema(ItinerarySchema) },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const listAllItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/all',
  tags,
  request: {
    params: ItineraryBaseParamSchema,
    query: AcademicYearContextQuerySchema,
  },
  responses: {
    200: {
      description: 'Itinerary list',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getItineraryIdentifiersRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/identifiers',
  tags,
  request: { params: ItineraryBaseParamSchema },
  responses: {
    200: {
      description: 'Itinerary identifiers',
      content: {
        'application/json': {
          schema: z.array(ItineraryIdentifierSchema),
        },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const getItineraryRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/{id}',
  tags,
  request: {
    params: ItineraryIdParamSchema,
    query: AcademicYearContextQuerySchema,
  },
  responses: {
    200: {
      description: 'Itinerary details',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Itinerary not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const createItineraryRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries',
  tags,
  request: {
    params: ItineraryCreateParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveItineraryBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Itinerary created',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const bulkCreateItinerariesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/itineraries/bulk',
  tags,
  request: {
    params: ItineraryBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(BulkSaveItineraryBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Itineraries created in bulk',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const replaceItinerariesRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/itineraries/bulk',
  tags,
  request: {
    params: ItineraryBaseParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(BulkSaveItineraryBodySchema),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Itineraries replaced',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const updateItineraryRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/itineraries/{id}',
  tags,
  request: {
    params: ItineraryIdParamSchema,
    body: {
      content: {
        'application/json': { schema: SaveItineraryBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Itinerary updated',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
    400: { description: 'Bad request' },
    403: { description: 'Forbidden' },
    404: { description: 'Itinerary not found' },
    409: { description: 'Conflict' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteItineraryRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/itineraries/{id}',
  tags,
  request: { params: ItineraryIdParamSchema },
  responses: {
    204: { description: 'Itinerary deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Itinerary not found' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});

export const deleteAllItinerariesRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/itineraries',
  tags,
  request: { params: ItineraryBaseParamSchema },
  responses: {
    204: { description: 'All itineraries deleted' },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
