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
} from '@tfg-horarios/shared';

export const listItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries',
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
  },
});

export const listAllItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/all',
  request: {
    params: ItineraryBaseParamSchema,
  },
  responses: {
    200: {
      description: 'Itinerary list',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
    403: { description: 'Forbidden' },
  },
});

export const getItineraryIdentifiersRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/identifiers',
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
  },
});

export const getItineraryRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries/{id}',
  request: { params: ItineraryIdParamSchema },
  responses: {
    200: {
      description: 'Itinerary details',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Itinerary not found' },
  },
});

export const createItineraryRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries',
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
  },
});

export const bulkCreateItinerariesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/itineraries/bulk',
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
  },
});

export const replaceItinerariesRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/itineraries/bulk',
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
  },
});

export const updateItineraryRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/itineraries/{id}',
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
  },
});

export const deleteItineraryRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/itineraries/{id}',
  request: { params: ItineraryIdParamSchema },
  responses: {
    204: { description: 'Itinerary deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Itinerary not found' },
  },
});

export const deleteAllItinerariesRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/itineraries',
  request: { params: ItineraryBaseParamSchema },
  responses: {
    204: { description: 'All itineraries deleted' },
    403: { description: 'Forbidden' },
  },
});
