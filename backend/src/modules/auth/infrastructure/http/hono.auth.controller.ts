import type { Context } from 'hono';
import { LoginUseCase } from '../../application/login.usecase';
import { RegisterUseCase } from '../../application/register.usecase';

export class HonoAuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase
  ) {}

  async login(c: Context) {
    const body = await c.req.json();
    const result = await this.loginUseCase.execute(body);
    c.header(
      'Set-Cookie',
      `token=${result.token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
    );
    return c.json(result, 200);
  }

  async register(c: Context) {
    const body = await c.req.json();
    const result = await this.registerUseCase.execute(body);
    return c.json(result, 201);
  }
}
