import { CreateOrganizationUseCase } from '../../application/create-organization.usecase';
import { ListOrganizationsUseCase } from '../../application/list-organizations.usecase';
import type { DeleteOrganizationUseCase } from '../../application/delete-organization.usecase';
import type { RouteHandler } from '@hono/zod-openapi';
import {
  createOrgRoute,
  listOrgRoute,
  deleteOrgRoute,
} from './hono.organization.routes';
import type { AppEnv } from '@/core/types/app-types';

export class HonoOrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase
  ) {}

  create: RouteHandler<typeof createOrgRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const newOrg = await this.createOrganizationUseCase.execute(body, userId);
    return c.json(newOrg, 201);
  };

  list: RouteHandler<typeof listOrgRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const result = await this.listOrganizationsUseCase.execute(userId);
    return c.json(result, 200);
  };

  delete: RouteHandler<typeof deleteOrgRoute, AppEnv> = async (c) => {
    const organizationId = c.req.param('id');
    const userId = c.get('userId');
    await this.deleteOrganizationUseCase.execute(organizationId, userId);
    return c.body(null, 204);
  };
}
