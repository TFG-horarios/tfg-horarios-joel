import { z } from '@hono/zod-openapi';

export const ScheduleSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.string().uuid().openapi({
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
    publishedAt: z.string().datetime().optional().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Schedule');

export const CreateScheduleSchema = z
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

export const ScheduleEntrySchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174005',
    }),
    scheduleId: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    subjectGroupId: z.string().uuid(),
    classroomId: z.string().uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('ScheduleEntry');

export const CreateScheduleEntrySchema = z
  .object({
    subjectGroupId: z.string().uuid(),
    classroomId: z.string().uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .openapi('CreateScheduleEntry');

export const GenerateScheduleRequestSchema = z
  .object({
    organizationId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    academicYear: z.string().openapi({ example: '2025-2026' }),
    degree: z.string().openapi({ example: 'Grado en Ingeniería Informática' }),
    courseYear: z.number().int().positive().openapi({ example: 3 }),
    period: z.number().int().positive().openapi({ example: 1 }),
    shift: z.enum(['morning', 'afternoon']).openapi({ example: 'morning' }),
  })
  .openapi('GenerateScheduleRequest');
  
export type ScheduleDTO = z.infer<typeof ScheduleSchema>;
export type CreateScheduleDTO = z.infer<typeof CreateScheduleSchema>;
export type ScheduleEntryDTO = z.infer<typeof ScheduleEntrySchema>;
export type CreateScheduleEntryDTO = z.infer<typeof CreateScheduleEntrySchema>;
export type GenerateScheduleRequestDTO = z.infer<typeof GenerateScheduleRequestSchema>;