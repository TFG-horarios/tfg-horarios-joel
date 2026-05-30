import { OpenAPIHono } from '@hono/zod-openapi';
import { AuthUserAdapter } from './infrastructure/adapters/auth-user.adapter';
import { JwtService } from './infrastructure/services/jwt.service';
import { PasswordHasherService } from './infrastructure/services/password-hasher.service';
import { LoginUseCase } from './application/login.usecase';
import { RegisterUseCase } from './application/register.usecase';
import { HonoAuthController } from './infrastructure/http/hono.auth.controller';
import {
  loginRoute,
  registerRoute,
} from './infrastructure/http/hono.auth.routes';
import type { AppEnv } from '@/core/types/app-types';
import type { IUserRepository } from '../user/domain/user.repository';

export const createAuthModule = (
  jwtService: JwtService,
  userRepository: IUserRepository
) => {
  const passwordHasherService = new PasswordHasherService();
  const authUserAdapter = new AuthUserAdapter(userRepository);

  const loginUseCase = new LoginUseCase(
    authUserAdapter,
    jwtService,
    passwordHasherService
  );
  const registerUseCase = new RegisterUseCase(
    authUserAdapter,
    jwtService,
    passwordHasherService
  );

  const controller = new HonoAuthController(loginUseCase, registerUseCase);

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(loginRoute, controller.login)
    .openapi(registerRoute, controller.register);
  return routes;
};
