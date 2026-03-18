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
  })
  .openapi('CreateOrganization');
