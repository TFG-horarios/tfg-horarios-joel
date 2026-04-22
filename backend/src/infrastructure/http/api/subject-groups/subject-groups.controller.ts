import { OpenAPIHono } from '@hono/zod-openapi';
import { listSubjectGroupsRoute, createSubjectGroupRoute } from './subject-groups.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { ListSubjectGroupsUseCase } from '../../../../application/use-cases/subject-group/list-subject-groups.usecase';
import { CreateSubjectGroupUseCase } from '../../../../application/use-cases/subject-group/create-subject-group.usecase';
import { authMiddleware } from '../../../http/middlewares/auth.middleware';
import { roleGuard } from '../../../http/middlewares/role.guard';

export const subjectGroupsController = new OpenAPIHono();

subjectGroupsController.use(authMiddleware);

subjectGroupsController.use('/{subjectId}/groups', async (c, next) => {
  if (c.req.method === 'POST') {
    return roleGuard(['admin', 'editor'])(c, next);
  }
  return roleGuard(['admin', 'editor', 'viewer'])(c, next);
});

subjectGroupsController.openapi(listSubjectGroupsRoute, async (c) => {
  const { subjectId } = c.req.valid('param');

  const useCase = container.resolve<ListSubjectGroupsUseCase>(DI_TOKENS.ListSubjectGroupsUseCase);
  const result = await useCase.execute(subjectId);

  return c.json(result, 200);
});

subjectGroupsController.openapi(createSubjectGroupRoute, async (c) => {
  const { subjectId } = c.req.valid('param');
  const body = c.req.valid('json');

  const useCase = container.resolve<CreateSubjectGroupUseCase>(DI_TOKENS.CreateSubjectGroupUseCase);

  try {
    const newGroup = await useCase.execute({
      subjectId,
      ...body,
    });
    return c.json(newGroup, 201);
  } catch (error: any) {
    return c.json({ message: error.message } as any, 400);
  }
});
