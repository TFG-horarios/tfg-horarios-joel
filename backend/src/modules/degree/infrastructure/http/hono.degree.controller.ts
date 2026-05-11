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
} from './hono.degree.routes';

export class HonoDegreeController {
  constructor(
    private readonly createDegreeUseCase: CreateDegreeUseCase,
    private readonly bulkCreateDegreesUseCase: BulkCreateDegreesUseCase,
    private readonly getDegreeUseCase: GetDegreeUseCase,
    private readonly listDegreesUseCase: ListDegreesUseCase,
    private readonly updateDegreeUseCase: UpdateDegreeUseCase,
    private readonly deleteDegreeUseCase: DeleteDegreeUseCase
  ) {}

  list: RouteHandler<typeof listDegreesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const degrees = await this.listDegreesUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(degrees, 200);
  };

  get: RouteHandler<typeof getDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, degreeId } = c.req.valid('param');
    const degree = await this.getDegreeUseCase.execute(
      organizationId,
      degreeId,
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

  update: RouteHandler<typeof updateDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, degreeId } = c.req.valid('param');
    const body = c.req.valid('json');
    const updatedDegree = await this.updateDegreeUseCase.execute(
      organizationId,
      degreeId,
      c.get('userId'),
      body
    );
    return c.json(updatedDegree, 200);
  };

  delete: RouteHandler<typeof deleteDegreeRoute, AppEnv> = async (c) => {
    const { organizationId, degreeId } = c.req.valid('param');
    await this.deleteDegreeUseCase.execute(
      organizationId,
      degreeId,
      c.get('userId')
    );
    return c.body(null, 204);
  };
}
