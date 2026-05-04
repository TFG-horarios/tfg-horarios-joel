import { z } from '@hono/zod-openapi';

export const SubjectSchema = z
  .object({
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    name: z.string().openapi({
      example: 'Matemáticas I',
    }),
    code: z.string().openapi({
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
    degree: z.string().openapi({
      example: 'Grado en Ingeniería Informática',
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
    itineraryName: z.string().optional().openapi({
      example: 'Itinerary A',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Subject');

export const CreateSubjectSchema = z
  .object({
    name: z.string().min(2).openapi({
      example: 'Matemáticas I',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    code: z.string().min(2).openapi({
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
    degree: z.string().min(2).openapi({
      example: 'Grado en Ingeniería Informática',
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
    itineraryName: z.string().optional().openapi({
      example: 'Itinerary A',
    }),
  })
  .openapi('CreateSubject');

export type SubjectDTO = z.infer<typeof SubjectSchema>;
export type CreateSubjectDTO = z.infer<typeof CreateSubjectSchema>;
