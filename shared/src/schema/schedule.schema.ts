import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';
import { SHIFT_TYPES } from './subject.schema';

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
    academicYearId: z.uuid(),
    shift: z.enum(SHIFT_TYPES).openapi({ example: 'morning' }),
    courseYear: z.number().int().positive().openapi({ example: 1 }),
    period: z.number().int().positive().openapi({ example: 1 }),
    conflicts: z.number().int().min(0).openapi({ example: 0 }),
    unassigned: z.number().int().min(0).openapi({ example: 0 }),
    status: z.enum(['draft', 'published']).openapi({ example: 'draft' }),
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
    academicYearId: z.uuid(),
    shift: z.enum(SHIFT_TYPES).openapi({ example: 'morning' }),
    courseYear: z.number().int().positive().openapi({ example: 1 }),
    period: z.number().int().positive().openapi({ example: 1 }),
    itineraryId: z
      .uuid()
      .optional()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
  })
  .openapi('SaveSchedule');

export const ScheduleListQuerySchema = PaginationQuerySchema.extend({
  academicYearId: z.uuid().optional(),
  degreeId: z.string().optional(),
  itineraryId: z.string().optional(),
  shift: z.enum(SHIFT_TYPES).optional(),
  courseYear: z.coerce.number().int().positive().optional(),
  period: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'published']).optional(),
  hasConflicts: z
    .enum([
      'all',
      'conflicts',
      'unassigned',
      'conflictsAndUnassigned',
      'withoutConflictsAndUnassigned',
    ])
    .optional(),
});

export type ScheduleDTO = z.infer<typeof ScheduleSchema>;
export type ScheduleBaseParamDTO = z.infer<typeof ScheduleBaseParamSchema>;
export type ScheduleIdParamDTO = z.infer<typeof ScheduleIdParamSchema>;
export type SaveScheduleDTO = z.infer<typeof SaveScheduleBodySchema>;
export type ScheduleListQueryDTO = z.infer<typeof ScheduleListQuerySchema>;

// TODO: Añadir todas las restricciones blandas para el manejo de conflictos
export const OPTIMIZATIONS = [
  'roomType',
  'lowerFloor',
  'classroomConsolidation',
  'studentGaps',
] as const;

export const GenerationScopeSchema = z
  .object({
    academicYearId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174004' }),
    periods: z
      .array(z.number().int().min(1).max(4))
      .min(1)
      .openapi({ example: [1, 2] }),
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
    optimizations: z
      .array(z.enum(OPTIMIZATIONS))
      .optional()
      .openapi({ example: ['studentGaps'] }),
  })
  .openapi('GenerationScope');

export type GenerationScopeDTO = z.infer<typeof GenerationScopeSchema>;
