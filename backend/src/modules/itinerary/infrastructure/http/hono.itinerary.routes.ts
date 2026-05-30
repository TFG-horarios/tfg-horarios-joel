import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ItinerarySchema,
  ItineraryBaseParamSchema,
  SaveItineraryBodySchema,
  ItineraryIdParamSchema,
  ItineraryCreateParamSchema,
} from '@tfg-horarios/shared';

export const listItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/itineraries',
  request: { params: ItineraryBaseParamSchema },
  responses: {
    200: {
      description: 'Itinerary list',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
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
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries/bulk',
  request: {
    params: ItineraryCreateParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(SaveItineraryBodySchema),
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
