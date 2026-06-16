import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoUserController } from './infrastructure/http/hono.user.controller';
import { DrizzleUserRepository } from './infrastructure/db/drizzle.user.repository';
import type { DbConnection } from '@/core/db/connection';
import { UpdateUserUseCase } from './application/update-user.usecase';
import { GetUserByEmailUseCase } from './application/get-by-email.usecase';
import { GetUserByIdUseCase } from './application/get-by-id.usecase';
import { UpdateUserPasswordUseCase } from './application/update-password.usecase';
import { DeleteUserUseCase } from './application/delete-account.usecase';
import { PasswordHasherService } from '../auth/infrastructure/services/password-hasher.service';
import type { AppEnv } from '@/core/types/app-types';
import {
  getMeRoute,
  updateMeRoute,
  getUserByEmailRoute,
  updatePasswordRoute,
  deleteMeRoute,
} from './infrastructure/http/hono.user.routes';

export const createUserModule = (db: DbConnection) => {
  const userRepository = new DrizzleUserRepository(db);
  const passwordHasherService = new PasswordHasherService();

  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
  const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const updateUserPasswordUseCase = new UpdateUserPasswordUseCase(
    userRepository,
    passwordHasherService
  );
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  const controller = new HonoUserController(
    getUserByEmailUseCase,
    getUserByIdUseCase,
    updateUserUseCase,
    updateUserPasswordUseCase,
    deleteUserUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(getMeRoute, controller.getMe)
    .openapi(updateMeRoute, controller.updateMe)
    .openapi(updatePasswordRoute, controller.updatePassword)
    .openapi(deleteMeRoute, controller.deleteMe)
    .openapi(getUserByEmailRoute, controller.getByEmail);

  return routes;
};
