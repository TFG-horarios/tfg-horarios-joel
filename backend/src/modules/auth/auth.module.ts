import { OpenAPIHono } from '@hono/zod-openapi';
import { DrizzleAuthRepository } from './infrastructure/db/drizzle.auth.repository';
import { JwtService } from './infrastructure/services/jwt.service';
import { PasswordHasherService } from './infrastructure/services/password-hasher.service';
import { LoginUseCase } from './application/login.usecase';
import { RegisterUseCase } from './application/register.usecase';
import { HonoAuthController } from './infrastructure/http/hono.auth.controller';
import type { DbConnection } from '@/core/db/connection';
import {
  loginRoute,
  registerRoute,
} from './infrastructure/http/hono.auth.routes';
import type { AppEnv } from '@/core/types/app-types';

export const createAuthModule = (db: DbConnection) => {
  const jwtSecret = Bun.env.JWT_SECRET || '';
  const jwtExpiresInSeconds =
    Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
  if (!jwtSecret) throw new Error('JWT_SECRET missing');

  const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);
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
  const router = new OpenAPIHono<AppEnv>();

  router.openapi(loginRoute, controller.login);
  router.openapi(registerRoute, controller.register);

  return router;
};
