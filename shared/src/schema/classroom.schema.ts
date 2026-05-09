import { z } from '@hono/zod-openapi';

export const ClassroomSchema = z
  .object({
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    name: z.string().min(2).max(100).openapi({
      example: 'Aula 1.1',
    }),
    capacity: z.number().int().positive().openapi({
      example: 60,
    }),
    type: z.enum(['theory', 'lab']).openapi({
      example: 'lab',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    deleteAt: z.iso.datetime().nullable().openapi({
      example: null,
    }),
  })
  .openapi('Classroom');

export const CreateClassroomParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

export const CreateClassroomBodySchema = z
  .object({
    name: z.string().min(2).max(100).openapi({
      example: 'Aula 1.1',
    }),
    capacity: z.number().int().positive().openapi({
      example: 60,
    }),
  })
  .openapi('CreateClassroom');

export type ClassroomDTO = z.infer<typeof ClassroomSchema>;
export type CreateClassroomParamsDTO = z.infer<
  typeof CreateClassroomParamsSchema
>;
export type CreateClassroomDTO = z.infer<typeof CreateClassroomBodySchema>;
