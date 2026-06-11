import { z } from '@hono/zod-openapi';

export const AcademicYearSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    name: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Must be YYYY-YYYY format.')
      .openapi({ example: '2025-2026' }),
    isActive: z.boolean().openapi({ example: true }),
    period0Start: z.string().nullable().openapi({ example: '2025-09-01' }),
    period0End: z.string().nullable().openapi({ example: '2026-06-30' }),
    period1Start: z.string().nullable().openapi({ example: '2025-09-01' }),
    period1End: z.string().nullable().openapi({ example: '2026-01-31' }),
    period2Start: z.string().nullable().openapi({ example: '2026-02-01' }),
    period2End: z.string().nullable().openapi({ example: '2026-06-30' }),
    period3Start: z.string().nullable().openapi({ example: null }),
    period3End: z.string().nullable().openapi({ example: null }),
    createdAt: z.iso.datetime().openapi({ example: '2024-03-10T10:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2024-03-10T10:00:00Z' }),
  })
  .openapi('AcademicYear');

export type AcademicYearDTO = z.infer<typeof AcademicYearSchema>;

export const SaveAcademicYearBodySchema = z
  .object({
    name: z.string().regex(/^\d{4}-\d{4}$/, 'Must be YYYY-YYYY format.'),
    period0Start: z.string().nullable().optional(),
    period0End: z.string().nullable().optional(),
    period1Start: z.string().nullable().optional(),
    period1End: z.string().nullable().optional(),
    period2Start: z.string().nullable().optional(),
    period2End: z.string().nullable().optional(),
    period3Start: z.string().nullable().optional(),
    period3End: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.period0Start && data.period0End) {
        return data.period0Start <= data.period0End;
      }
      if (data.period1Start && data.period1End) {
        return data.period1Start <= data.period1End;
      }
      if (data.period2Start && data.period2End) {
        return data.period2Start <= data.period2End;
      }
      if (data.period3Start && data.period3End) {
        return data.period3Start <= data.period3End;
      }
      return true;
    },
    {
      message: 'Period end date must be after the start date.',
    }
  )
  .refine(
    (data) => {
      if (data.period0End && data.period1Start) {
        return data.period0End <= data.period1Start;
      }
      if (data.period1End && data.period2Start) {
        return data.period1End <= data.period2Start;
      }
      if (data.period2End && data.period3Start) {
        return data.period2End <= data.period3Start;
      }
      return true;
    },
    {
      message: 'Period end date must be before the next period start date.',
    }
  )
  .openapi('SaveAcademicYearBody');

export type SaveAcademicYearBodyDTO = z.infer<
  typeof SaveAcademicYearBodySchema
>;
