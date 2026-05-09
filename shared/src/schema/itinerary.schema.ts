import { z } from '@hono/zod-openapi';

export const ItinerarySchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    degreeId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Software Engineering' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('Itinerary');

export const CreateItineraryParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
  degreeId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174002',
  }),
});

export const CreateItineraryBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Software Engineering' }),
  })
  .openapi('CreateItinerary');

export type ItineraryDTO = z.infer<typeof ItinerarySchema>;
export type CreateItineraryParamsDTO = z.infer<
  typeof CreateItineraryParamsSchema
>;
export type CreateItineraryDTO = z.infer<typeof CreateItineraryBodySchema>;
