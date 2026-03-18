import { z } from '@hono/zod-openapi';

export const ClassroomSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    name: z.string().openapi({
      example: 'Aula 1.1',
    }),
    capacity: z.number().int().positive().openapi({
      example: 60,
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Classroom');

export const CreateClassroomSchema = z
  .object({
    name: z.string().min(1).openapi({
      example: 'Aula 1.1',
    }),
    capacity: z.number().int().positive().openapi({
      example: 60,
    }),
  })
  .openapi('CreateClassroom');
