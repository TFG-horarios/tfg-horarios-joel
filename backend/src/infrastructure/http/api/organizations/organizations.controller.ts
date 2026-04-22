import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listOrganizationsRoute,
  createOrganizationRoute,
} from './organizations.routes';
import { container, DI_TOKENS } from '../../../di/container';
import { ListOrganizationsUseCase } from '../../../../application/use-cases/organization/list-organizations.usecase';
import { CreateOrganizationUseCase } from '../../../../application/use-cases/organization/create-organization.usecase';
import { authMiddleware } from '../../../http/middlewares/auth.middleware';

export const organizationsController = new OpenAPIHono();

organizationsController.use(authMiddleware);

organizationsController.openapi(listOrganizationsRoute, async (c) => {
  const useCase = container.resolve<ListOrganizationsUseCase>(DI_TOKENS.ListOrganizationsUseCase);
  const result = await useCase.execute();
  return c.json(result, 200);
});

organizationsController.openapi(createOrganizationRoute, async (c) => {
  const { name, periodType, morningStart, morningEnd, afternoonStart, afternoonEnd, slotDurationMinutes } = c.req.valid('json');
  
  const useCase = container.resolve<CreateOrganizationUseCase>(DI_TOKENS.CreateOrganizationUseCase);
  
  try {
    const newOrg = await useCase.execute({ name, periodType, morningStart, morningEnd, afternoonStart, afternoonEnd, slotDurationMinutes });
    return c.json(newOrg, 201);
  } catch (error) {
    return c.json({ message: error.message }, 400);
  }
});
