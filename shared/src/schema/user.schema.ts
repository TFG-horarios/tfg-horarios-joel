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
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
  })
  .openapi('User');

export const CreateUserSchema = z
  .object({
    name: z.string().min(2).openapi({
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      example: 'john.doe@example.com',
    }),
    password: z.string().min(6).openapi({
      example: 'secure-password',
    }),
  })
  .openapi('CreateUser');
