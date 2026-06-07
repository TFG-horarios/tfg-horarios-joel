import { z } from '@hono/zod-openapi';

export const AcademicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'Invalid academic year format. Must be YYYY-YYYY.')
  .refine(
    (val) => {
      const [startYearStr, endYearStr] = val.split('-');
      if (!startYearStr || !endYearStr) return false;
      const startYear = parseInt(startYearStr, 10);
      const endYear = parseInt(endYearStr, 10);
      return endYear === startYear + 1;
    },
    {
      message: 'The end year must be exactly one year after the start year.',
    }
  )
  .brand('AcademicYear')
  .openapi({ example: '2025-2026' });

export type AcademicYear = z.infer<typeof AcademicYearSchema>;
