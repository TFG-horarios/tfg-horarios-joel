import { z } from '@hono/zod-openapi';

export const ScheduleSlotSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174005' }),
    scheduleId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    subjectGroupId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    classroomId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    dayOfWeek: z.number().int().min(1).max(7).openapi({ example: 1 }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '08:00' }),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '10:00' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('ScheduleSlot');

export const ScheduleSlotBaseParamSchema = z.object({
  scheduleId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const ScheduleSlotIdParamSchema = ScheduleSlotBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174005' }),
});

export const SaveScheduleSlotBodySchema = z
  .object({
    subjectGroupId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    classroomId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    dayOfWeek: z.number().int().min(1).max(7).openapi({ example: 1 }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '08:00' }),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '10:00' }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .openapi('SaveScheduleSlot');

export type ScheduleSlotDTO = z.infer<typeof ScheduleSlotSchema>;
export type ScheduleSlotBaseParamDTO = z.infer<
  typeof ScheduleSlotBaseParamSchema
>;
export type ScheduleSlotIdParamDTO = z.infer<typeof ScheduleSlotIdParamSchema>;
export type SaveScheduleSlotDTO = z.infer<typeof SaveScheduleSlotBodySchema>;
