import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { CreateDegreeUseCase } from '../../application/create-degree.usecase';
import type { BulkCreateDegreesUseCase } from '../../application/bulk-create-degree.usecase';
import type { GetDegreeUseCase } from '../../application/get-degree.usecase';
import type { ListDegreesUseCase } from '../../application/list-degree.usecase';
import type { UpdateDegreeUseCase } from '../../application/update-degree.usecase';
import type { DeleteDegreeUseCase } from '../../application/delete-degree.usecase';
import type {
  createDegreeRoute,
  bulkCreateDegreesRoute,
  getDegreeRoute,
  listDegreesRoute,
  updateDegreeRoute,
  deleteDegreeRoute,
  deleteAllDegreesRoute,
  replaceDegreesRoute,
  getDegreeIdentifiersRoute,
} from './hono.degree.routes';
import type { DeleteAllDegreesUseCase } from '../../application/delete-all-degrees.usecase';
import type { ReplaceDegreesUseCase } from '../../application/replace-degrees.usecase';
import type { GetDegreeIdentifiersUseCase } from '../../application/get-degree-identifiers.usecase';

export class HonoDegreeController {
  constructor(
    private readonly createDegreeUseCase: CreateDegreeUseCase,
    private readonly bulkCreateDegreesUseCase: BulkCreateDegreesUseCase,
    private readonly getDegreeUseCase: GetDegreeUseCase,
    private readonly listDegreesUseCase: ListDegreesUseCase,
    private readonly updateDegreeUseCase: UpdateDegreeUseCase,
    private readonly deleteDegreeUseCase: DeleteDegreeUseCase,
    private readonly deleteAllDegreesUseCase: DeleteAllDegreesUseCase,
    private readonly replaceDegreesUseCase: ReplaceDegreesUseCase,
    private readonly getDegreeIdentifiersUseCase: GetDegreeIdentifiersUseCase
  ) {}

  list: RouteHandler<typeof listDegreesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const degrees = await this.listDegreesUseCase.execute(
      organizationId,
      c.get('userId'),
      query
    );
    return c.json(degrees, 200);
  };

  getIdentifiers: RouteHandler<typeof getDegreeIdentifiersRoute, AppEnv> =
    async (c) => {
      const { organizationId } = c.req.valid('param');
      const identifiers = await this.getDegreeIdentifiersUseCase.execute(
        organizationId,
        c.get('userId')
      );
      return c.json(identifiers, 200);
    };

  get: RouteHandler<typeof getDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const degree = await this.getDegreeUseCase.execute(
      organizationId,
      id,
      c.get('userId')
    );
    return c.json(degree, 200);
  };

  create: RouteHandler<typeof createDegreeRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const newDegree = await this.createDegreeUseCase.execute(
      organizationId,
      c.get('userId'),
      body
    );
    return c.json(newDegree, 201);
  };

  bulkCreate: RouteHandler<typeof bulkCreateDegreesRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const newDegrees = await this.bulkCreateDegreesUseCase.execute(
      organizationId,
      c.get('userId'),
      bodyArray
    );
    return c.json(newDegrees, 201);
  };

  replace: RouteHandler<typeof replaceDegreesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const replacedDegrees = await this.replaceDegreesUseCase.execute(
      organizationId,
      c.get('userId'),
      bodyArray
    );
    return c.json(replacedDegrees, 200);
  };

  update: RouteHandler<typeof updateDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const body = c.req.valid('json');
    const updatedDegree = await this.updateDegreeUseCase.execute(
      organizationId,
      id,
      c.get('userId'),
      body
    );
    return c.json(updatedDegree, 200);
  };

  delete: RouteHandler<typeof deleteDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    await this.deleteDegreeUseCase.execute(organizationId, id, c.get('userId'));
    return c.body(null, 204);
  };

  deleteAll: RouteHandler<typeof deleteAllDegreesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    await this.deleteAllDegreesUseCase.execute(organizationId, c.get('userId'));
    return c.body(null, 204);
  };
}
