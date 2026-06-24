import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';

export const SHIFT_TYPES = ['morning', 'afternoon'] as const;
export type Shift = (typeof SHIFT_TYPES)[number];

export const SubjectSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    degreeId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    itineraryId: z
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
    name: z.string().min(3).max(100).openapi({ example: 'Mathematics I' }),
    code: z.string().min(2).max(20).openapi({ example: 'MAT101' }),
    availableShifts: z
      .array(z.enum(SHIFT_TYPES))
      .openapi({ example: ['morning', 'afternoon'] }),
    numberOfStudents: z.number().int().nonnegative().openapi({ example: 150 }),
    courseYear: z.number().int().positive().openapi({ example: 1 }),
    period: z.number().int().nonnegative().openapi({ example: 1 }),
    weeklyHours: z.number().int().positive().openapi({ example: 6 }),
    isCommon: z.boolean().openapi({ example: true }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    deletedAt: z.iso.datetime().nullable().openapi({ example: null }),
  })
  .openapi('Subject');

export const SubjectIdentifierSchema = z.string().openapi('SubjectIdentifier');

export const SubjectListParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const SubjectCreateParamSchema = SubjectListParamSchema.extend({
  degreeId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
});

export const SubjectIdParamSchema = SubjectListParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SubjectListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  code: z.string().optional(),
  shift: z.enum(SHIFT_TYPES).optional(),
  period: z.coerce.number().optional(),
  itineraryId: z.string().optional(),
  degreeId: z.string().optional(),
  courseYear: z.coerce.number().optional(),
});

export const SaveSubjectBodySchema = z
  .object({
    name: z.string().min(3).max(100).openapi({ example: 'Mathematics I' }),
    code: z.string().min(2).max(20).openapi({ example: 'MAT101' }),
    availableShifts: z
      .array(z.enum(SHIFT_TYPES))
      .min(1)
      .openapi({ example: ['morning'] }),
    numberOfStudents: z.coerce
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 150 }),
    courseYear: z.coerce.number().int().positive().openapi({ example: 1 }),
    period: z.coerce.number().int().nonnegative().openapi({ example: 1 }),
    weeklyHours: z.coerce.number().int().positive().openapi({ example: 6 }),
    isCommon: z.boolean().openapi({ example: true }),
    itineraryId: z
      .uuid()
      .optional()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
  })
  .openapi('SaveSubject');

export const BulkSaveSubjectBodySchema = SaveSubjectBodySchema.extend({
  degreeId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
}).openapi('BulkSaveSubject');

export type SubjectDTO = z.infer<typeof SubjectSchema>;
export type SaveSubjectDTO = z.infer<typeof SaveSubjectBodySchema>;
export type BulkSaveSubjectDTO = z.infer<typeof BulkSaveSubjectBodySchema>;
export type SubjectIdentifierDTO = z.infer<typeof SubjectIdentifierSchema>;
export type SubjectListQueryDTO = z.infer<typeof SubjectListQuerySchema>;
