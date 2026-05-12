import { z } from '@hono/zod-openapi';

export const ClassroomSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    name: z.string().min(2).max(100).openapi({ example: 'Aula 1.1' }),
    capacity: z.number().int().positive().openapi({ example: 60 }),
    type: z.enum(['theory', 'lab']).openapi({ example: 'lab' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('Classroom');

export const ClassroomBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const ClassroomIdParamSchema = ClassroomBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SaveClassroomBodySchema = z
  .object({
    name: z.string().min(2).max(100).openapi({ example: 'Aula 1.1' }),
    capacity: z.number().int().positive().openapi({ example: 60 }),
    type: z.enum(['theory', 'lab']).openapi({ example: 'lab' }),
  })
  .openapi('SaveClassroom');

export type ClassroomDTO = z.infer<typeof ClassroomSchema>;
export type ClassroomBaseParamDTO = z.infer<typeof ClassroomBaseParamSchema>;
export type ClassroomIdParamDTO = z.infer<typeof ClassroomIdParamSchema>;
export type SaveClassroomDTO = z.infer<typeof SaveClassroomBodySchema>;
