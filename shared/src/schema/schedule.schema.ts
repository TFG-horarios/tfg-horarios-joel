import { z } from '@hono/zod-openapi';

export const ScheduleSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    degreeId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    itineraryId: z
      .uuid()
      .optional()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
    academicYear: z.string().openapi({ example: '2025-2026' }),
    shift: z.enum(['morning', 'afternoon']).openapi({ example: 'morning' }),
    courseYear: z.number().int().positive().openapi({ example: 1 }),
    period: z.number().int().positive().openapi({ example: 1 }),
    status: z
      .enum(['draft', 'published', 'archived'])
      .openapi({ example: 'draft' }),
    version: z.string().openapi({ example: 'v1.0' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('Schedule');

export const ScheduleBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const ScheduleIdParamSchema = ScheduleBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SaveScheduleBodySchema = z
  .object({
    academicYear: z.string().openapi({ example: '2025-2026' }),
    shift: z.enum(['morning', 'afternoon']).openapi({ example: 'morning' }),
    courseYear: z.number().int().positive().openapi({ example: 1 }),
    period: z.number().int().positive().openapi({ example: 1 }),
    itineraryId: z
      .uuid()
      .optional()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
  })
  .openapi('SaveSchedule');

export type ScheduleDTO = z.infer<typeof ScheduleSchema>;
export type ScheduleBaseParamDTO = z.infer<typeof ScheduleBaseParamSchema>;
export type ScheduleIdParamDTO = z.infer<typeof ScheduleIdParamSchema>;
export type SaveScheduleDTO = z.infer<typeof SaveScheduleBodySchema>;

export const GenerationScopeSchema = z
  .object({
    academicYear: z.string().openapi({ example: '2025-2026' }),
    period: z.number().int().min(1).max(4).openapi({ example: 1 }),
    degreeIds: z
      .array(z.uuid())
      .optional()
      .openapi({ example: ['123e4567-e89b-12d3-a456-426614174002'] }),
    itineraryIds: z
      .array(z.uuid())
      .optional()
      .openapi({ example: ['123e4567-e89b-12d3-a456-426614174003'] }),
    courseYears: z
      .array(z.number().int().positive())
      .optional()
      .openapi({ example: [1, 2] }),
  })
  .openapi('GenerationScope');

export type GenerationScopeDTO = z.infer<typeof GenerationScopeSchema>;
