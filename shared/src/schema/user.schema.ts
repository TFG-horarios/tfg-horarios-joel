import { z } from '@hono/zod-openapi';

export const UserSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    name: z.string().openapi({
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      example: 'john.doe@example.com',
    }),
    role: z.enum(['admin', 'editor', 'viewer']).optional().openapi({
      example: 'admin',
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('User');

export type UserDTO = z.infer<typeof UserSchema>;
