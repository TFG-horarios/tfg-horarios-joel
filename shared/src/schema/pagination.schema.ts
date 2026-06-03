import { z } from '@hono/zod-openapi';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

export type PaginationQueryDTO = z.infer<typeof PaginationQuerySchema>;
export type PaginationMetaDTO = z.infer<typeof PaginationMetaSchema>;
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetaDTO;
}
