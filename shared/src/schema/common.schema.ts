import { z } from '@hono/zod-openapi';

export const OrgIdParamSchema = z.object({
  orgId: z.uuid().openapi({
    param: {
      name: 'orgId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const SubjectIdParamSchema = z.object({
  subjectId: z.uuid().openapi({
    param: {
      name: 'subjectId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

export const OrgAndSubjectIdParamSchema = OrgIdParamSchema.extend({
  subjectId: z.uuid().openapi({
    param: {
      name: 'subjectId',
      in: 'path',
    },
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});
