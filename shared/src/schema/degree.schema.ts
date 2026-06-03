import { z } from '@hono/zod-openapi';

export const DegreeSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Computer Engineering' }),
    code: z.string().min(2).max(10).openapi({ example: 'IB1' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('Degree');

export const DegreeIdentifierSchema = z
  .object({
    name: z.string(),
    code: z.string(),
  })
  .openapi('DegreeIdentifier');

export const DegreeBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const DegreeIdParamSchema = DegreeBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const DegreeListQuerySchema = z.object({
  search: z.string().optional(),
  code: z.string().optional(),
});

export const SaveDegreeBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Computer Engineering' }),
    code: z.string().min(2).max(10).openapi({ example: 'IB1' }),
  })
  .openapi('SaveDegree');

export type DegreeDTO = z.infer<typeof DegreeSchema>;
export type DegreeBaseParamDTO = z.infer<typeof DegreeBaseParamSchema>;
export type DegreeIdParamDTO = z.infer<typeof DegreeIdParamSchema>;
export type SaveDegreeDTO = z.infer<typeof SaveDegreeBodySchema>;
export type DegreeIdentifierDTO = z.infer<typeof DegreeIdentifierSchema>;
export type DegreeListQueryDTO = z.infer<typeof DegreeListQuerySchema>;
