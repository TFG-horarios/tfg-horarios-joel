import { CreateOrganizationUseCase } from '../../application/create-organization.usecase';
import { ListOrganizationsUseCase } from '../../application/list-organizations.usecase';
import type { DeleteOrganizationUseCase } from '../../application/delete-organization.usecase';
import type { RouteHandler } from '@hono/zod-openapi';
import {
  createOrgRoute,
  listOrgRoute,
  getOrgRoute,
  deleteOrgRoute,
  updateOrgRoute,
} from './hono.organization.routes';
import type { AppEnv } from '@/core/types/app-types';
import type { GetOrganizationUseCase } from '../../application/get-organization.usecase';
import type { UpdateOrganizationUseCase } from '../../application/update-organization.usecase';

export class HonoOrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase
  ) {}

  create: RouteHandler<typeof createOrgRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const newOrg = await this.createOrganizationUseCase.execute(body, userId);
    return c.json(newOrg, 201);
  };

  get: RouteHandler<typeof getOrgRoute, AppEnv> = async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.get('userId');
    const org = await this.getOrganizationUseCase.execute(id, userId);
    return c.json(org, 200);
  };

  list: RouteHandler<typeof listOrgRoute, AppEnv> = async (c) => {
    const userId = c.get('userId');
    const result = await this.listOrganizationsUseCase.execute(userId);
    return c.json(result, 200);
  };

  update: RouteHandler<typeof updateOrgRoute, AppEnv> = async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.get('userId');
    const result = await this.updateOrganizationUseCase.execute(
      id,
      userId,
      body
    );
    return c.json(result, 200);
  };

  delete: RouteHandler<typeof deleteOrgRoute, AppEnv> = async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.get('userId');
    await this.deleteOrganizationUseCase.execute(id, userId);
    return c.body(null, 204);
  };
}
