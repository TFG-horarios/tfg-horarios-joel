import { z } from '@hono/zod-openapi';
import { SHIFT_TYPES } from './subject.schema';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

export const ScheduleTimeConfigSchema = z
  .object({
    id: z.uuid(),
    organizationId: z.uuid(),
    academicYearId: z.uuid(),
    degreeId: z.uuid(),
    itineraryId: z.uuid().nullable(),
    courseYear: z.number().int().positive(),
    period: z.number().int().positive(),
    shift: z.enum(SHIFT_TYPES),
    startTime: timeSchema,
    endTime: timeSchema,
    hasBreak: z.boolean(),
    breakAfterSlot: z.number().int().positive().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi('ScheduleTimeConfig');

export const SaveScheduleTimeConfigBodySchema = ScheduleTimeConfigSchema.pick({
  degreeId: true,
  itineraryId: true,
  courseYear: true,
  period: true,
  shift: true,
  startTime: true,
  endTime: true,
  hasBreak: true,
  breakAfterSlot: true,
})
  .refine((data) => data.endTime > data.startTime, {
    message: 'The end time must be later than the start time.',
    path: ['endTime'],
  })
  .refine(
    (data) =>
      data.hasBreak
        ? data.breakAfterSlot !== null
        : data.breakAfterSlot === null,
    {
      message: 'breakAfterSlot is required only when the break is enabled.',
      path: ['breakAfterSlot'],
    }
  )
  .openapi('SaveScheduleTimeConfigBody');

export const UpdateScheduleTimeConfigBodySchema = ScheduleTimeConfigSchema.pick(
  {
    startTime: true,
    endTime: true,
    hasBreak: true,
    breakAfterSlot: true,
  }
)
  .refine((data) => data.endTime > data.startTime, {
    message: 'The end time must be later than the start time.',
    path: ['endTime'],
  })
  .refine(
    (data) =>
      data.hasBreak
        ? data.breakAfterSlot !== null
        : data.breakAfterSlot === null,
    {
      message: 'breakAfterSlot is required only when the break is enabled.',
      path: ['breakAfterSlot'],
    }
  );

export const ScheduleTimeConfigListQuerySchema = z.object({
  degreeId: z.uuid().optional(),
  itineraryId: z.uuid().optional(),
  courseYear: z.coerce.number().int().positive().optional(),
  period: z.coerce.number().int().positive().optional(),
  shift: z.enum(SHIFT_TYPES).optional(),
});

export type ScheduleTimeConfigDTO = z.infer<typeof ScheduleTimeConfigSchema>;
export type SaveScheduleTimeConfigBodyDTO = z.infer<
  typeof SaveScheduleTimeConfigBodySchema
>;
export type UpdateScheduleTimeConfigBodyDTO = z.infer<
  typeof UpdateScheduleTimeConfigBodySchema
>;
export type ScheduleTimeConfigListQueryDTO = z.infer<
  typeof ScheduleTimeConfigListQuerySchema
>;

export const ScheduleTimeConfigPossibilitySchema = z
  .object({
    degreeId: z.uuid(),
    itineraryId: z.uuid().nullable(),
    courseYear: z.number().int().positive(),
    period: z.number().int().positive(),
    shift: z.enum(SHIFT_TYPES),
  })
  .openapi('ScheduleTimeConfigPossibility');

export type ScheduleTimeConfigPossibilityDTO = z.infer<
  typeof ScheduleTimeConfigPossibilitySchema
>;
