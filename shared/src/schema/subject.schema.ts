import { z } from '@hono/zod-openapi';

export const SubjectSchema = z
  .object({
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    name: z.string().min(3).max(100).openapi({
      example: 'Mathematics I',
    }),
    code: z.string().min(2).max(20).openapi({
      example: 'MAT101',
    }),
    availableShifts: z.array(z.enum(['morning', 'afternoon'])).openapi({
      example: ['morning', 'afternoon'],
    }),
    numberOfStudents: z.number().int().nonnegative().openapi({
      example: 150,
    }),
    courseYear: z.number().int().positive().openapi({
      example: 1,
    }),
    degreeId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    period: z.number().int().nonnegative().openapi({
      example: 1,
    }),
    weeklyHours: z.number().int().positive().openapi({
      example: 6,
    }),
    isCommon: z.boolean().openapi({
      example: true,
    }),
    itineraryId: z.uuid().optional().openapi({
      example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Subject');

export const CreateSubjectParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
  degreeId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174002',
  }),
  itineraryId: z.uuid().optional().openapi({
    example: '123e4567-e89b-12d3-a456-426614174003',
  }),
});

export const CreateSubjectBodySchema = z
  .object({
    name: z.string().min(3).max(100).openapi({
      example: 'Mathematics I',
    }),
    code: z.string().min(2).max(20).openapi({
      example: 'MAT101',
    }),
    availableShifts: z.array(z.enum(['morning', 'afternoon'])).openapi({
      example: ['morning', 'afternoon'],
    }),
    numberOfStudents: z.number().int().nonnegative().openapi({
      example: 150,
    }),
    courseYear: z.number().int().positive().openapi({
      example: 1,
    }),
    period: z.number().int().nonnegative().openapi({
      example: 1,
    }),
    weeklyHours: z.number().int().positive().openapi({
      example: 6,
    }),
    isCommon: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi('CreateSubject');

export type SubjectDTO = z.infer<typeof SubjectSchema>;
export type CreateSubjectParamsDTO = z.infer<typeof CreateSubjectParamsSchema>;
export type CreateSubjectDTO = z.infer<typeof CreateSubjectBodySchema>;
