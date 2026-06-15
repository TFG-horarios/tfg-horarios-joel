import { z } from '@hono/zod-openapi';

export const OrganizationSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Mathematics faculty' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('Organization');

export const OrganizationIdParamSchema = z.object({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const SaveOrganizationBodySchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(100)
      .openapi({ example: 'Mathematics faculty' }),
  })
  .openapi('SaveOrganization');

export type OrganizationDTO = z.infer<typeof OrganizationSchema>;
export type OrganizationIdParamDTO = z.infer<typeof OrganizationIdParamSchema>;
export type SaveOrganizationDTO = z.infer<typeof SaveOrganizationBodySchema>;
