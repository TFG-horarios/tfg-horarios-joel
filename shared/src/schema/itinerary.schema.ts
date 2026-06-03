import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';

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
    code: z.string().min(2).max(10).openapi({ example: 'SE-2025' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('Itinerary');

export const ItineraryIdentifierSchema = z
  .string()
  .openapi('ItineraryIdentifier');

export const ItineraryBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const ItineraryIdParamSchema = ItineraryBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const ItineraryListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  code: z.string().optional(),
  degreeId: z.string().optional(),
});

export const ItineraryCreateParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
  degreeId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
});

export const SaveItineraryBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Software Engineering' }),
    code: z.string().min(2).max(10).openapi({ example: 'SE-2025' }),
  })
  .openapi('SaveItinerary');

export const BulkSaveItineraryBodySchema = SaveItineraryBodySchema.extend({
  degreeId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
}).openapi('BulkSaveItinerary');

export type ItineraryDTO = z.infer<typeof ItinerarySchema>;
export type ItineraryBaseParamDTO = z.infer<typeof ItineraryBaseParamSchema>;
export type ItineraryIdParamDTO = z.infer<typeof ItineraryIdParamSchema>;
export type ItineraryCreateParamDTO = z.infer<
  typeof ItineraryCreateParamSchema
>;
export type SaveItineraryDTO = z.infer<typeof SaveItineraryBodySchema>;
export type BulkSaveItineraryDTO = z.infer<typeof BulkSaveItineraryBodySchema>;
export type ItineraryIdentifierDTO = z.infer<typeof ItineraryIdentifierSchema>;
export type ItineraryListQueryDTO = z.infer<typeof ItineraryListQuerySchema>;
