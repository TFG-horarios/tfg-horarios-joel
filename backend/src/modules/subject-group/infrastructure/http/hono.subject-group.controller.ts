import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import {
  listSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
} from './hono.subject-group.routes';
import type { BulkCreateSubjectGroupUseCase } from '../../application/bulk-create-subject-group.usecase';
import type { ListSubjectGroupsUseCase } from '../../application/list-subject-group.usecase';
import type { GetSubjectGroupUseCase } from '../../application/get-subject-group.usecase';
import type { DeleteSubjectGroupUseCase } from '../../application/delete-subject-group.usecase';
import type { UpdateSubjectGroupUseCase } from '../../application/update-subject-group.usecase';
import type { CreateSubjectGroupUseCase } from '../../application/create-subject-group.usecase';

export class HonoSubjectGroupController {
  constructor(
    private readonly listUseCase: ListSubjectGroupsUseCase,
    private readonly getUseCase: GetSubjectGroupUseCase,
    private readonly createUseCase: CreateSubjectGroupUseCase,
    private readonly bulkCreateUseCase: BulkCreateSubjectGroupUseCase,
    private readonly updateUseCase: UpdateSubjectGroupUseCase,
    private readonly deleteUseCase: DeleteSubjectGroupUseCase
  ) {}

  list: RouteHandler<typeof listSubjectGroupsRoute, AppEnv> = async (c) => {
    const { organizationId, subjectId } = c.req.valid('param');
    const result = await this.listUseCase.execute(
      organizationId,
      subjectId,
      c.get('userId')
    );
    return c.json(result, 200);
  };

  get: RouteHandler<typeof getSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, subjectId, id } = c.req.valid('param');
    const result = await this.getUseCase.execute(
      organizationId,
      subjectId,
      id,
      c.get('userId')
    );
    return c.json(result, 200);
  };

  create: RouteHandler<typeof createSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, subjectId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.createUseCase.execute(
      organizationId,
      subjectId,
      c.get('userId'),
      body
    );
    return c.json(result, 201);
  };

  bulkCreate: RouteHandler<typeof bulkCreateSubjectGroupsRoute, AppEnv> =
    async (c) => {
      const { organizationId, subjectId } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await this.bulkCreateUseCase.execute(
        organizationId,
        subjectId,
        c.get('userId'),
        body
      );
      return c.json(result, 201);
    };

  update: RouteHandler<typeof updateSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, subjectId, id } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.updateUseCase.execute(
      organizationId,
      subjectId,
      id,
      c.get('userId'),
      body
    );
    return c.json(result, 200);
  };

  delete: RouteHandler<typeof deleteSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, subjectId, id } = c.req.valid('param');
    await this.deleteUseCase.execute(
      organizationId,
      subjectId,
      id,
      c.get('userId')
    );
    return c.body(null, 204);
  };
}
