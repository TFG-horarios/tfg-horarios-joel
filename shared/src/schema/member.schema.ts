import { z } from '@hono/zod-openapi';

export const MemberSchema = z
  .object({
    id: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    userName: z.string().openapi({
      example: 'John Doe',
    }),
    userEmail: z.email().openapi({
      example: 'john.doe@example.com',
    }),
    organizationId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    userId: z.uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({
      example: 'admin',
    }),
    createdAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.iso.datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('Member');

export const CreateMemberSchema = z
  .object({
    email: z.email({ message: 'Invalid email format' }).openapi({
      example: 'john.doe@example.com',
    }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({
      example: 'editor',
    }),
  })
  .openapi('Create Member');

export const UpdateMemberRoleSchema = z
  .object({
    role: z.enum(['admin', 'editor', 'viewer']).openapi({
      example: 'viewer',
    }),
  })
  .openapi('Update Member Role');

export type MemberDTO = z.infer<typeof MemberSchema>;
export type CreateMemberDTO = z.infer<typeof CreateMemberSchema>;
export type UpdateMemberRoleDTO = z.infer<typeof UpdateMemberRoleSchema>;
