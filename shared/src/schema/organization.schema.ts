import { z } from '@hono/zod-openapi';

export const OrganizationSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Mathematics faculty' }),
    periodType: z
      .enum(['semester', 'trimester', 'annual'])
      .openapi({ example: 'semester' }),
    morningStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '08:00' }),
    morningEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '14:00' }),
    afternoonStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '14:00' }),
    afternoonEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '20:00' }),
    slotDurationMinutes: z.number().int().positive().openapi({ example: 60 }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('Organization');

export const OrganizationIdParamSchema = z.object({
  id: z
    .uuid({ message: 'Invalid organization ID' })
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SaveOrganizationBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Mathematics faculty' }),
    periodType: z
      .enum(['semester', 'trimester', 'annual'])
      .openapi({ example: 'semester' }),
    morningStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '08:00' }),
    morningEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '14:00' }),
    afternoonStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '14:00' }),
    afternoonEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
      .openapi({ example: '20:00' }),
    slotDurationMinutes: z.number().int().positive().openapi({ example: 60 }),
  })
  .refine((data) => data.afternoonEnd > data.afternoonStart, {
    message: 'The end time must be later than the start time',
    path: ['afternoonEnd'],
  })
  .refine((data) => data.morningEnd > data.morningStart, {
    message: 'The end time must be later than the start time',
    path: ['morningEnd'],
  })
  .openapi('SaveOrganization');

export type OrganizationDTO = z.infer<typeof OrganizationSchema>;
export type OrganizationIdParamDTO = z.infer<typeof OrganizationIdParamSchema>;
export type SaveOrganizationDTO = z.infer<typeof SaveOrganizationBodySchema>;
