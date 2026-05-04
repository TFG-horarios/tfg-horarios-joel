import type { Context } from 'hono';
import { LoginUseCase } from '../../application/login.usecase';
import { RegisterUseCase } from '../../application/register.usecase';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from '../../domain/auth.errors';
import { DomainException } from '../../../../core/errors/domain.exception';
import { LoginSchema, RegisterSchema } from '@tfg-horarios/shared';

export class HonoAuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase
  ) {}

  async login(c: Context) {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { message: 'Validation error', errors: parsed.error.flatten() },
        400
      );
    }

    try {
      const result = await this.loginUseCase.execute(parsed.data);

      c.header(
        'Set-Cookie',
        `token=${result.token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
      );

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return c.json({ message: error.message }, 401);
      }
      if (error instanceof DomainException) {
        return c.json({ message: error.message }, 400);
      }
      return c.json({ message: 'Internal server error' }, 500);
    }
  }

  async register(c: Context) {
    const body = await c.req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { message: 'Validation error', errors: parsed.error.flatten() },
        400
      );
    }

    try {
      const result = await this.registerUseCase.execute(parsed.data);
      return c.json(result, 201);
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        return c.json({ message: error.message }, 409);
      }
      if (error instanceof DomainException) {
        return c.json({ message: error.message }, 400);
      }
      return c.json({ message: 'Internal server error' }, 500);
    }
  }
}
