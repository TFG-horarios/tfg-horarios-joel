import { LoginUseCase } from '../../application/login.usecase';
import { RegisterUseCase } from '../../application/register.usecase';
import type { RouteHandler } from '@hono/zod-openapi';
import type { loginRoute, registerRoute } from './hono.auth.routes';
import type { AppEnv } from '@/core/types/app-types';
import { setCookie } from 'hono/cookie';

export class HonoAuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase
  ) {}

  login: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
    const body = c.req.valid('json');
    const result = await this.loginUseCase.execute(body);
    setCookie(c, 'auth-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    });
    return c.json(result, 200);
  };

  register: RouteHandler<typeof registerRoute, AppEnv> = async (c) => {
    const body = c.req.valid('json');
    const result = await this.registerUseCase.execute(body);
    setCookie(c, 'auth-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    });
    return c.json(result, 201);
  };
}
