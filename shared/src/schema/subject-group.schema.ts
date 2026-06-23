import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';
import { SHIFT_TYPES } from './subject.schema';

export const GROUP_TYPES = [
  'theory',
  'problems',
  'practices',
  'reduced_practices',
  'tutoring',
] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

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
    groupType: z.enum(GROUP_TYPES).openapi({ example: 'theory' }),
    shift: z.enum(SHIFT_TYPES).openapi({ example: 'morning' }),
    groupNumber: z.number().int().positive().openapi({ example: 1 }),
    weeklyHours: z.number().positive().openapi({ example: 2.5 }),
    numberOfStudents: z.number().int().nonnegative().openapi({ example: 50 }),
    needsComputerLab: z.boolean().default(false).openapi({ example: false }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('SubjectGroup');

export const SubjectGroupIdentifierSchema = z
  .object({
    subjectId: z.string(),
    shift: z.enum(SHIFT_TYPES),
    groupType: z.enum(GROUP_TYPES),
    weeklyHours: z.number(),
    groupNumber: z.number(),
    numberOfStudents: z.number(),
  })
  .openapi('SubjectGroupIdentifier');

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

export const SubjectGroupListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  subjectId: z.string().optional(),
  shift: z.enum(SHIFT_TYPES).optional(),
  groupType: z.enum(GROUP_TYPES).optional(),
  degreeId: z.string().optional(),
  itineraryId: z.string().optional(),
  term: z.coerce.number().int().min(1).max(2).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  needsComputerLab: z.enum(['true', 'false']).optional(),
});

export const SaveSubjectGroupBodySchema = z
  .object({
    name: z.string().min(2).openapi({ example: 'Grupo 1 Theory' }),
    groupType: z.enum(GROUP_TYPES).openapi({ example: 'theory' }),
    shift: z.enum(SHIFT_TYPES).openapi({ example: 'morning' }),
    groupNumber: z.coerce.number().int().positive().openapi({ example: 1 }),
    weeklyHours: z.coerce.number().positive().openapi({ example: 2.5 }),
    numberOfStudents: z.coerce
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 50 }),
    needsComputerLab: z.boolean().default(false).openapi({ example: false }),
  })
  .openapi('SaveSubjectGroup');

export const BulkSaveSubjectGroupBodySchema = SaveSubjectGroupBodySchema.extend(
  {
    subjectId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
  }
).openapi('BulkSaveSubjectGroup');

export type SubjectGroupDTO = z.infer<typeof SubjectGroupSchema>;
export type SubjectGroupBaseParamDTO = z.infer<
  typeof SubjectGroupBaseParamSchema
>;
export type SubjectGroupCreateParamDTO = z.infer<
  typeof SubjectGroupCreateParamSchema
>;
export type SubjectGroupIdParamDTO = z.infer<typeof SubjectGroupIdParamSchema>;
export type SaveSubjectGroupDTO = z.infer<typeof SaveSubjectGroupBodySchema>;
export type BulkSaveSubjectGroupDTO = z.infer<
  typeof BulkSaveSubjectGroupBodySchema
>;
export type SubjectGroupIdentifierDTO = z.infer<
  typeof SubjectGroupIdentifierSchema
>;
export type SubjectGroupListQueryDTO = z.infer<
  typeof SubjectGroupListQuerySchema
>;
