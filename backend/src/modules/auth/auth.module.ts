import { OpenAPIHono } from '@hono/zod-openapi';
import {
  LoginSchema,
  AuthResponseSchema,
  RegisterSchema,
} from '@tfg-horarios/shared';
import { DrizzleAuthRepository } from './infrastructure/database/drizzle.auth.repository';
import { JwtService } from './infrastructure/services/jwt.service';
import { PasswordHasherService } from './infrastructure/services/password-hasher.service';
import { LoginUseCase } from './application/login.usecase';
import { RegisterUseCase } from './application/register.usecase';
import { HonoAuthController } from './infrastructure/http/hono.auth.controller';
import type { DbConnection } from 'src/core/db/connection';

export const createAuthModule = (db: DbConnection) => {
  const jwtService = new JwtService();
  const passwordHasherService = new PasswordHasherService();
  const authRepository = new DrizzleAuthRepository(db);
  const loginUseCase = new LoginUseCase(
    authRepository,
    jwtService,
    passwordHasherService
  );
  const registerUseCase = new RegisterUseCase(
    authRepository,
    jwtService,
    passwordHasherService
  );
  const controller = new HonoAuthController(loginUseCase, registerUseCase);
  const router = new OpenAPIHono();

  router.openapi(
    {
      method: 'post',
      path: '/login',
      request: {
        body: {
          content: {
            'application/json': { schema: LoginSchema },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': { schema: AuthResponseSchema },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Invalid credentials' },
        500: { description: 'Internal server error' },
      },
    },
    (c) => controller.login(c)
  );

  router.openapi(
    {
      method: 'post',
      path: '/register',
      request: {
        body: {
          content: {
            'application/json': { schema: RegisterSchema },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': { schema: AuthResponseSchema },
          },
        },
        400: { description: 'Validation error' },
        409: { description: 'User already exists' },
        500: { description: 'Internal server error' },
      },
    },
    (c) => controller.register(c)
  );

  return router;
};
