import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';
import { AcademicYearSchema } from './academic-year.schema';

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

export const ClassroomIdentifierSchema = z
  .string()
  .openapi('ClassroomIdentifier');

export const ClassroomBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const ClassroomIdParamSchema = ClassroomBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const ClassroomListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  type: z.enum(['theory', 'lab']).optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
});

export const SaveClassroomBodySchema = z
  .object({
    name: z.string().min(2).max(100).openapi({ example: 'Aula 1.1' }),
    capacity: z.coerce.number().int().positive().openapi({ example: 60 }),
    type: z.enum(['theory', 'lab']).openapi({ example: 'lab' }),
  })
  .openapi('SaveClassroom');

export const ClassroomScheduleQuerySchema = z.object({
  academicYear: AcademicYearSchema.optional(),
  shift: z.enum(['morning', 'afternoon']).optional(),
  period: z.coerce.number().int().positive().optional(),
});

export const ClassroomConfigurationListQuerySchema =
  PaginationQuerySchema.extend({
    search: z.string().optional(),
    academicYear: AcademicYearSchema.optional(),
    shift: z.enum(['morning', 'afternoon']).optional(),
    period: z.coerce.number().int().positive().optional(),
  });

export type ClassroomDTO = z.infer<typeof ClassroomSchema>;
export type ClassroomBaseParamDTO = z.infer<typeof ClassroomBaseParamSchema>;
export type ClassroomIdParamDTO = z.infer<typeof ClassroomIdParamSchema>;
export type SaveClassroomDTO = z.infer<typeof SaveClassroomBodySchema>;
export type ClassroomIdentifierDTO = z.infer<typeof ClassroomIdentifierSchema>;
export type ClassroomListQueryDTO = z.infer<typeof ClassroomListQuerySchema>;
export type ClassroomScheduleQueryDTO = z.infer<
  typeof ClassroomScheduleQuerySchema
>;
export type ClassroomConfigurationListQueryDTO = z.infer<
  typeof ClassroomConfigurationListQuerySchema
>;
