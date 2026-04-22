import { OpenAPIHono } from '@hono/zod-openapi';
import { listSubjectsRoute, createSubjectRoute } from './subjects.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { ListSubjectsUseCase } from '../../../../application/use-cases/subject/list-subjects.usecase';
import { CreateSubjectUseCase } from '../../../../application/use-cases/subject/create-subject.usecase';
import { authMiddleware } from '../../../http/middlewares/auth.middleware';
import { roleGuard } from '../../../http/middlewares/role.guard';

export const subjectsController = new OpenAPIHono();

subjectsController.use(authMiddleware);

subjectsController.use('/{orgId}/subjects', async (c, next) => {
  if (c.req.method === 'POST') {
    return roleGuard(['admin', 'editor'])(c, next);
  }
  return roleGuard(['admin', 'editor', 'viewer'])(c, next);
});

subjectsController.openapi(listSubjectsRoute, async (c) => {
  const { orgId } = c.req.valid('param');

  const useCase = container.resolve<ListSubjectsUseCase>(
    DI_TOKENS.ListSubjectsUseCase
  );
  const result = await useCase.execute(orgId);

  return c.json(result, 200);
});

subjectsController.openapi(createSubjectRoute, async (c) => {
  const { orgId } = c.req.valid('param');
  const body = c.req.valid('json');

  const useCase = container.resolve<CreateSubjectUseCase>(
    DI_TOKENS.CreateSubjectUseCase
  );

  try {
    const newSubject = await useCase.execute({
      organizationId: orgId,
      ...body,
    });
    return c.json(newSubject, 201);
  } catch (error) {
    return c.json({ message: error.message }, 400);
  }
});
