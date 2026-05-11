import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoUserController } from './infrastructure/http/hono.user.controller';
import { DrizzleUserRepository } from './infrastructure/db/drizzle.user.repository';
import type { DbConnection } from '@/core/db/connection';
import { UpdateUserUseCase } from './application/update.usecase';
import { GetUserByEmailUseCase } from './application/get-by-email.usecase';
import { GetUserByIdUseCase } from './application/get-by-id.usecase';
import type { AppEnv } from '@/core/types/app-types';
import {
  getMeRoute,
  updateMeRoute,
  getUserByEmailRoute,
} from './infrastructure/http/hono.user.routes';

export const createUserModule = (
  db: DbConnection,
  getUserByEmailUseCase: GetUserByEmailUseCase
) => {
  const userRepository = new DrizzleUserRepository(db);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const controller = new HonoUserController(
    getUserByEmailUseCase,
    getUserByIdUseCase,
    updateUserUseCase
  );

  const router = new OpenAPIHono<AppEnv>();

  router.openapi(getMeRoute, controller.getMe);
  router.openapi(updateMeRoute, controller.updateMe);
  router.openapi(getUserByEmailRoute, controller.getByEmail);

  return router;
};
