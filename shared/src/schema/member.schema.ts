import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';

export const MemberSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    userName: z.string().openapi({ example: 'John Doe' }),
    userEmail: z.email().openapi({ example: 'john.doe@example.com' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    userId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({ example: 'admin' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('Member');

export const MemberBaseParamSchema = z.object({
  organizationId: z
    .uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
});

export const MemberIdParamSchema = MemberBaseParamSchema.extend({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
});

export const CreateMemberBodySchema = z
  .object({
    email: z.email().openapi({ example: 'john.doe@example.com' }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({ example: 'editor' }),
  })
  .openapi('CreateMember');

export const UpdateMemberRoleBodySchema = z
  .object({
    role: z.enum(['admin', 'editor', 'viewer']).openapi({ example: 'viewer' }),
  })
  .openapi('UpdateMemberRole');

export const MemberListQuerySchema = PaginationQuerySchema.extend({
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
});

export type MemberDTO = z.infer<typeof MemberSchema>;
export type MemberBaseParamDTO = z.infer<typeof MemberBaseParamSchema>;
export type MemberIdParamDTO = z.infer<typeof MemberIdParamSchema>;
export type CreateMemberDTO = z.infer<typeof CreateMemberBodySchema>;
export type UpdateMemberRoleDTO = z.infer<typeof UpdateMemberRoleBodySchema>;
export type MemberListQueryDTO = z.infer<typeof MemberListQuerySchema>;
