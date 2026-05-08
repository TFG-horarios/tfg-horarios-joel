import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoUserController } from './infrastructure/http/hono.user.controller';
import { DrizzleUserRepository } from './infrastructure/db/drizzle.user.repository';
import { createAuthMiddleware } from '@/core/middlewares/auth.middleware';
import type { DbConnection } from '@/core/db/connection';
import { JwtService } from '@/modules/auth/infrastructure/services/jwt.service';
import { UpdateUserUseCase } from './application/update.usecase';
import { GetUserByEmailUseCase } from './application/get-by-email.usecase';
import { GetUserByIdUseCase } from './application/get-by-id.usecase';
import type { AppEnv } from '@/core/types/app-types';
import {
  getMeRoute,
  updateMeRoute,
  getUserByEmailRoute,
} from './infrastructure/http/hono.user.routes';

export const createUserModule = (db: DbConnection) => {
  const userRepository = new DrizzleUserRepository(db);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
  const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const controller = new HonoUserController(
    getUserByEmailUseCase,
    getUserByIdUseCase,
    updateUserUseCase
  );

  const router = new OpenAPIHono<AppEnv>();
  const jwtSecret = Bun.env.JWT_SECRET || '';
  const jwtExpiresInSeconds = Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
  if (!jwtSecret) throw new Error('JWT_SECRET missing');
  const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);

  router.use('*', createAuthMiddleware(jwtService));
  router.openapi(getMeRoute, controller.getMe);
  router.openapi(updateMeRoute, controller.updateMe);
  router.openapi(getUserByEmailRoute, controller.getByEmail);

  return router;
};
