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

export const CreateAndListItineraryParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
  degreeId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174002',
  }),
});

export const GetAndDeleteAndUpdateItineraryParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
  degreeId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
  itineraryId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const CreateAndUpdateItineraryBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Software Engineering' }),
  })
  .openapi('CreateAndUpdateItinerary');

export type ItineraryDTO = z.infer<typeof ItinerarySchema>;
export type CreateAndListItineraryParamsDTO = z.infer<
  typeof CreateAndListItineraryParamsSchema
>;
export type CreateAndUpdateItineraryDTO = z.infer<
  typeof CreateAndUpdateItineraryBodySchema
>;
export type GetAndDeleteAndUpdateItineraryParamDTO = z.infer<
  typeof GetAndDeleteAndUpdateItineraryParamSchema
>;
