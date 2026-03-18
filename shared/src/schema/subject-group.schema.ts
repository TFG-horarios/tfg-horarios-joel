import { z } from '@hono/zod-openapi';

export const SubjectGroupSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    subjectId: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    name: z.string().openapi({
      example: 'Grupo 1 Theory',
    }),
    groupType: z.enum(['theory', 'problems', 'labs']).openapi({
      example: 'theory',
    }),
    shift: z.enum(['morning', 'afternoon']).openapi({
      example: 'morning',
    }),
    groupNumber: z.number().int().positive().openapi({
      example: 1,
    }),
    weeklyHours: z.number().positive().openapi({
      example: 2,
    }),
    numberOfStudents: z.number().int().nonnegative().openapi({
      example: 50,
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('SubjectGroup');

export const CreateSubjectGroupSchema = z
  .object({
    name: z.string().min(2).openapi({
      example: 'Grupo 1 Theory',
    }),
    groupType: z.enum(['theory', 'problems', 'labs']).openapi({
      example: 'theory',
    }),
    shift: z.enum(['morning', 'afternoon']).openapi({
      example: 'morning',
    }),
    groupNumber: z.number().int().positive().openapi({
      example: 1,
    }),
    weeklyHours: z.number().positive().openapi({
      example: 2,
    }),
    numberOfStudents: z.number().int().nonnegative().openapi({
      example: 50,
    }),
  })
  .openapi('CreateSubjectGroup');
