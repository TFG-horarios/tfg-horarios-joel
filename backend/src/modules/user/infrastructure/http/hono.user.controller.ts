import type { AppEnv } from '@/core/types/app-types';
import { GetUserByEmailUseCase } from '../../application/get-by-email.usecase';
import { GetUserByIdUseCase } from '../../application/get-by-id.usecase';
import type { UpdateUserUseCase } from '../../application/update-user.usecase';
import type { RouteHandler } from '@hono/zod-openapi';
import type {
  getUserByEmailRoute,
  updateMeRoute,
  getMeRoute,
} from './hono.user.routes';

export class HonoUserController {
  constructor(
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase
  ) {}

  getMe: RouteHandler<typeof getMeRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const user = await this.getUserByIdUseCase.execute(userId);
    return c.json(user, 200);
  };

  updateMe: RouteHandler<typeof updateMeRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const updatedUser = await this.updateUserUseCase.execute(userId, body);
    return c.json(updatedUser, 200);
  };

  getByEmail: RouteHandler<typeof getUserByEmailRoute, AppEnv> = async (c) => {
    const email = c.req.valid('query').email;
    const user = await this.getUserByEmailUseCase.execute(email);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json(user, 200);
  };
}
