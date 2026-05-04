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
    publishedAt: z.iso.datetime().optional().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
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
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174005',
    }),
    scheduleId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    subjectGroupId: z.uuid(),
    classroomId: z.uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi('ScheduleEntry');

export const CreateScheduleEntrySchema = z
  .object({
    subjectGroupId: z.uuid(),
    classroomId: z.uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
  })
  .openapi('CreateScheduleEntry');

export const GenerateScheduleRequestSchema = z
  .object({
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
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
export type GenerateScheduleRequestDTO = z.infer<
  typeof GenerateScheduleRequestSchema
>;
