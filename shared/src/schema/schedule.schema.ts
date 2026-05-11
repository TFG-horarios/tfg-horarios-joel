import { z } from '@hono/zod-openapi';

export const ScheduleSchema = z
  .object({
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    academicYear: z.string().openapi({
      example: '2025-2026',
    }),
    shift: z.enum(['morning', 'afternoon']).openapi({
      example: 'morning',
    }),
    courseYear: z.number().int().positive().openapi({
      example: 1,
    }),
    period: z.number().int().positive().openapi({
      example: 1,
    }),
    status: z.enum(['draft', 'published', 'archived']).openapi({
      example: 'draft',
    }),
    version: z.string().openapi({
      example: 'v1.0',
    }),
    degreeId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    itineraryId: z.uuid().optional().openapi({
      example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Schedule');

export const CreateScheduleParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
  degreeId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174002',
  }),
  itineraryId: z.uuid().optional().openapi({
    example: '123e4567-e89b-12d3-a456-426614174003',
  }),
});

export const CreateScheduleBodySchema = z
  .object({
    academicYear: z.string().openapi({
      example: '2025-2026',
    }),
    shift: z.enum(['morning', 'afternoon']).openapi({
      example: 'morning',
    }),
    courseYear: z.number().int().positive().openapi({
      example: 1,
    }),
    period: z.number().int().positive().openapi({
      example: 1,
    }),
  })
  .openapi('CreateSchedule');

export type ScheduleDTO = z.infer<typeof ScheduleSchema>;
export type CreateScheduleParamsDTO = z.infer<
  typeof CreateScheduleParamsSchema
>;
export type CreateScheduleDTO = z.infer<typeof CreateScheduleBodySchema>;
