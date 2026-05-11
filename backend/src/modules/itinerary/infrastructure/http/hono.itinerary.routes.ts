import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  ItinerarySchema,
  CreateAndListItineraryParamsSchema,
  CreateAndUpdateItineraryBodySchema,
  GetAndDeleteAndUpdateItineraryParamSchema,
} from '@tfg-horarios/shared';

export const listItinerariesRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries',
  request: { params: CreateAndListItineraryParamsSchema },
  responses: {
    200: {
      description: 'Itinerary list',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
  },
});

export const getItineraryRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries/{itineraryId}',
  request: { params: GetAndDeleteAndUpdateItineraryParamSchema },
  responses: {
    200: {
      description: 'Itinerary details',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
    404: { description: 'Itinerary not found' },
  },
});

export const createItineraryRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries',
  request: {
    params: CreateAndListItineraryParamsSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateItineraryBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Itinerary created',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
  },
});

export const bulkCreateItinerariesRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries/bulk',
  request: {
    params: CreateAndListItineraryParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: z.array(CreateAndUpdateItineraryBodySchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Itineraries created in bulk',
      content: { 'application/json': { schema: z.array(ItinerarySchema) } },
    },
  },
});

export const updateItineraryRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries/{itineraryId}',
  request: {
    params: GetAndDeleteAndUpdateItineraryParamSchema,
    body: {
      content: {
        'application/json': { schema: CreateAndUpdateItineraryBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Itinerary updated',
      content: { 'application/json': { schema: ItinerarySchema } },
    },
  },
});

export const deleteItineraryRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/degrees/{degreeId}/itineraries/{itineraryId}',
  request: { params: GetAndDeleteAndUpdateItineraryParamSchema },
  responses: { 204: { description: 'Itinerary deleted' } },
});
