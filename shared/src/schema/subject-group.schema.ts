import { z } from '@hono/zod-openapi';

export const SubjectGroupSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    subjectId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    name: z.string().openapi({ example: 'Grupo 1 Theory' }),
    groupType: z
      .enum(['theory', 'problems', 'practices'])
      .openapi({ example: 'theory' }),
    shift: z.enum(['morning', 'afternoon']).openapi({ example: 'morning' }),
    groupNumber: z.number().int().positive().openapi({ example: 1 }),
    weeklyHours: z.number().positive().openapi({ example: 2.5 }),
    numberOfStudents: z.number().int().nonnegative().openapi({ example: 50 }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('SubjectGroup');

export const SubjectGroupBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const SubjectGroupCreateParamSchema = SubjectGroupBaseParamSchema.extend(
  {
    subjectId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
  }
);

export const SubjectGroupIdParamSchema = SubjectGroupBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SaveSubjectGroupBodySchema = z
  .object({
    name: z.string().min(2).openapi({ example: 'Grupo 1 Theory' }),
    groupType: z
      .enum(['theory', 'problems', 'practices'])
      .openapi({ example: 'theory' }),
    shift: z.enum(['morning', 'afternoon']).openapi({ example: 'morning' }),
    groupNumber: z.number().int().positive().openapi({ example: 1 }),
    weeklyHours: z.number().positive().openapi({ example: 2.5 }),
    numberOfStudents: z.number().int().nonnegative().openapi({ example: 50 }),
  })
  .openapi('SaveSubjectGroup');

export type SubjectGroupDTO = z.infer<typeof SubjectGroupSchema>;
export type SubjectGroupBaseParamDTO = z.infer<
  typeof SubjectGroupBaseParamSchema
>;
export type SubjectGroupCreateParamDTO = z.infer<
  typeof SubjectGroupCreateParamSchema
>;
export type SubjectGroupIdParamDTO = z.infer<typeof SubjectGroupIdParamSchema>;
export type SaveSubjectGroupDTO = z.infer<typeof SaveSubjectGroupBodySchema>;
