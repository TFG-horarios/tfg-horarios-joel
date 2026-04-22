import { z } from '@hono/zod-openapi';

export const LoginSchema = z
  .object({
    email: z.string().email().openapi({
      example: 'user@example.com',
    }),
    password: z.string().min(10).max(128).openapi({
      example: 'password123',
    }),
  })
  .openapi('Login');

export const AuthResponseSchema = z
  .object({
    user: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    }),
    token: z.string(),
  })
  .openapi('AuthResponse');

export const RegisterSchema = z
  .object({
    name: z.string().min(2).max(120).openapi({
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      example: 'user@example.com',
    }),
    password: z.string().min(10).max(128).openapi({
      example: 'password123',
    }),
  })
  .openapi('Register');

export type LoginDTO = z.infer<typeof LoginSchema>;
export type AuthResponseDTO = z.infer<typeof AuthResponseSchema>;
export type RegisterDTO = z.infer<typeof RegisterSchema>;
