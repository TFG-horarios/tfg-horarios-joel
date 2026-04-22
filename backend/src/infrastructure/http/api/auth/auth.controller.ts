import { OpenAPIHono } from '@hono/zod-openapi';
import { loginRoute, registerRoute } from './auth.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { LoginUseCase } from '../../../../application/use-cases/auth/login.usecase';
import { RegisterUseCase } from '../../../../application/use-cases/auth/register.usecase';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

export const authController = new OpenAPIHono();

authController.openapi(loginRoute, async (c) => {
  const body = c.req.valid('json');
  const useCase = container.resolve<LoginUseCase>(DI_TOKENS.LoginUseCase);

  try {
    const result = await useCase.execute(body);
    return c.json(result, 200);
  } catch (error) {
    if (
      error instanceof DomainException &&
      error.message === 'Invalid credentials'
    ) {
      return c.json({ message: error.message }, 401);
    }

    if (error instanceof DomainException) {
      return c.json({ message: error.message }, 400);
    }

    return c.json({ message: 'Internal server error' }, 500);
  }
});

authController.openapi(registerRoute, async (c) => {
  const body = c.req.valid('json');
  const useCase = container.resolve<RegisterUseCase>(DI_TOKENS.RegisterUseCase);

  try {
    const result = await useCase.execute(body);
    return c.json(result, 201);
  } catch (error) {
    if (
      error instanceof DomainException &&
      error.message === 'User already exists'
    ) {
      return c.json({ message: error.message }, 409);
    }

    if (error instanceof DomainException) {
      return c.json({ message: error.message }, 400);
    }

    return c.json({ message: 'Internal server error' }, 500);
  }
});
