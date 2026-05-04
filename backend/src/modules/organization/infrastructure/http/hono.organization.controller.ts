import { type Context } from 'hono';
import { CreateOrganizationUseCase } from '../../application/create-organization.usecase';
import { ListOrganizationsUseCase } from '../../application/list-organizations.usecase';

export class HonoOrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase
  ) {}

  async create(c: Context) {
    const userId = c.get('userId') as string;
    const input = await (c.req as any).valid('json');

    try {
      const newOrg = await this.createOrganizationUseCase.execute(
        input,
        userId
      );
      return c.json(newOrg, 201);
    } catch (error: any) {
      return c.json({ message: error.message }, 400);
    }
  }

  async list(c: Context) {
    const userId = c.get('userId') as string;

    try {
      const result = await this.listOrganizationsUseCase.execute(userId);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ message: error.message }, 400);
    }
  }
}
