import { Context } from 'hono';
import { ListUsersUseCase } from '../../application/list-users.usecase';

export class HonoUserController {
  constructor(private readonly listUsersUseCase: ListUsersUseCase) {}

  async list(c: Context) {
    try {
      const result = await this.listUsersUseCase.execute();
      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ message: error.message }, 400);
    }
  }
}
