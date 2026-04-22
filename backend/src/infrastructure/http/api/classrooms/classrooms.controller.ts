import { OpenAPIHono } from '@hono/zod-openapi';
import { listClassroomsRoute, createClassroomRoute } from './classrooms.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { ListClassroomsUseCase } from '../../../../application/use-cases/classroom/list-classrooms.usecase';
import { CreateClassroomUseCase } from '../../../../application/use-cases/classroom/create-classroom.usecase';
import { authMiddleware } from '../../../http/middlewares/auth.middleware';
import { roleGuard } from '../../../http/middlewares/role.guard';

export const classroomsController = new OpenAPIHono();

classroomsController.use(authMiddleware);

classroomsController.use('/{orgId}/classrooms', async (c, next) => {
  if (c.req.method === 'POST') {
    return roleGuard(['admin', 'editor'])(c, next);
  }
  return roleGuard(['admin', 'editor', 'viewer'])(c, next);
});

classroomsController.openapi(listClassroomsRoute, async (c) => {
  const { orgId } = c.req.valid('param');

  const useCase = container.resolve<ListClassroomsUseCase>(DI_TOKENS.ListClassroomsUseCase);
  const result = await useCase.execute(orgId);

  return c.json(result, 200);
});

classroomsController.openapi(createClassroomRoute, async (c) => {
  const { orgId } = c.req.valid('param');
  const body = c.req.valid('json');

  const useCase = container.resolve<CreateClassroomUseCase>(DI_TOKENS.CreateClassroomUseCase);

  try {
    const newClassroom = await useCase.execute({
      organizationId: orgId,
      ...body,
    });
    return c.json(newClassroom, 201);
  } catch (error) {
    return c.json({ message: error.message }, 400);
  }
});
