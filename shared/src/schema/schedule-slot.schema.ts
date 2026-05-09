import z from 'zod';

export const ScheduleSlotSchema = z
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
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi('ScheduleSlot');

export const CreateScheduleSlotParamsSchema = z.object({
  scheduleId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

export const CreateScheduleSlotBodySchema = z
  .object({
    subjectGroupId: z.uuid(),
    classroomId: z.uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .openapi('CreateScheduleSlot');

export type ScheduleSlotDTO = z.infer<typeof ScheduleSlotSchema>;
export type CreateScheduleSlotDTO = z.infer<
  typeof CreateScheduleSlotBodySchema
>;
export type CreateScheduleSlotParamsDTO = z.infer<
  typeof CreateScheduleSlotParamsSchema
>;
