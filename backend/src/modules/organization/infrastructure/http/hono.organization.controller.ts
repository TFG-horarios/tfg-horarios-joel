import { type Context } from 'hono';
import { CreateOrganizationUseCase } from '../../application/create-organization.usecase';
import { ListOrganizationsUseCase } from '../../application/list-organizations.usecase';
import type { DeleteOrganizationUseCase } from '../../application/delete-organization.usecase';

export class HonoOrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase
  ) {}

  async create(c: Context) {
    const userId = c.get('userId') as string;
    const input = await (c.req as any).valid('json');
    const newOrg = await this.createOrganizationUseCase.execute(input, userId);
    return c.json(newOrg, 201);
  }

  async list(c: Context) {
    const userId = c.get('userId') as string;
    const result = await this.listOrganizationsUseCase.execute(userId);
    return c.json(result, 200);
  }

  async delete(c: Context) {
    const organizationId = c.req.param('id') as string;
    await this.deleteOrganizationUseCase.execute(organizationId);
    return c.json({ message: 'Organization deleted successfully' }, 200);
  }
}
