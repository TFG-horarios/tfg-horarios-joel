import { OpenAPIHono } from '@hono/zod-openapi';
import { listUsersRoute } from './users.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { ListUsersUseCase } from '../../../../application/use-cases/user/list-users.usecase';

export const usersController = new OpenAPIHono();

usersController.openapi(listUsersRoute, async (c) => {
  const useCase = container.resolve<ListUsersUseCase>(DI_TOKENS.ListUsersUseCase);
  const result = await useCase.execute();
  return c.json(result, 200);
});