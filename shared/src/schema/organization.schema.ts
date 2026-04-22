import { z } from '@hono/zod-openapi';

export const OrganizationSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    name: z.string().openapi({
      example: 'Facultad de Informática',
    }),
    periodType: z.enum(['semester', 'trimestral', 'annual']).openapi({
      example: 'semester',
    }),
    morningStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '08:00',
      }),
    morningEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '14:00',
      }),
    afternoonStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '14:00',
      }),
    afternoonEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '20:00',
      }),
    slotDurationMinutes: z.number().int().positive().openapi({
      example: 60,
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Organization');

export const CreateOrganizationSchema = z
  .object({
    name: z.string().min(3).openapi({
      example: 'Facultad de Matemáticas',
    }),
    periodType: z.enum(['semester', 'trimestral', 'annual']).openapi({
      example: 'semester',
    }),
    morningStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '08:00',
      }),
    morningEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '14:00',
      }),
    afternoonStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '14:00',
      }),
    afternoonEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .openapi({
        example: '20:00',
      }),
    slotDurationMinutes: z.number().int().positive().openapi({
      example: 60,
    }),
  })
  .openapi('CreateOrganization');

export type OrganizationDTO = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationDTO = z.infer<typeof CreateOrganizationSchema>;
