import { z } from '@hono/zod-openapi';

export const UserSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.email().openapi({ example: 'john.doe@example.com' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('User');

export const SaveUserBodySchema = z
  .object({
    name: z.string().min(2).openapi({ example: 'John Doe' }),
  })
  .openapi('SaveUser');

export const SearchUserQuerySchema = z
  .object({
    email: z
      .email({ message: 'Invalid email' })
      .openapi({ example: 'john.doe@example.com' }),
  })
  .openapi('SearchUserQuery');

export type UserDTO = z.infer<typeof UserSchema>;
export type SaveUserDTO = z.infer<typeof SaveUserBodySchema>;
export type SearchUserQueryDTO = z.infer<typeof SearchUserQuerySchema>;
