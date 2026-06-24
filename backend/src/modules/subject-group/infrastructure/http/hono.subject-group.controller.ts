import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import {
  listSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
  deleteAllSubjectGroupsRoute,
  replaceSubjectGroupsRoute,
  getSubjectGroupIdentifiersRoute,
  listAllSubjectGroupsRoute,
} from './hono.subject-group.routes';
import type { DeleteAllSubjectGroupsUseCase } from '../../application/delete-all-subject-groups.usecase';
import type { ReplaceSubjectGroupsUseCase } from '../../application/replace-subject-groups.usecase';
import type { GetSubjectGroupIdentifiersUseCase } from '../../application/get-subject-group-identifiers.usecase';
import type { ListAllSubjectGroupsUseCase } from '../../application/list-all-subject-groups.usecase';
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
    private readonly deleteUseCase: DeleteSubjectGroupUseCase,
    private readonly deleteAllUseCase: DeleteAllSubjectGroupsUseCase,
    private readonly replaceUseCase: ReplaceSubjectGroupsUseCase,
    private readonly getIdentifiersUseCase: GetSubjectGroupIdentifiersUseCase,
    private readonly listAllUseCase: ListAllSubjectGroupsUseCase
  ) {}

  list: RouteHandler<typeof listSubjectGroupsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const groups = await this.listUseCase.execute(
      organizationId,
      c.get('userId'),
      query
    );
    return c.json(groups, 200);
  };

  listAll: RouteHandler<typeof listAllSubjectGroupsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const { academicYearId } = c.req.valid('query');
    const groups = academicYearId
      ? await this.listAllUseCase.execute(
          organizationId,
          c.get('userId'),
          academicYearId
        )
      : await this.listAllUseCase.execute(organizationId, c.get('userId'));
    return c.json(groups, 200);
  };

  replace: RouteHandler<typeof replaceSubjectGroupsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.replaceUseCase.execute(
      organizationId,
      c.get('userId'),
      body
    );
    return c.json(result, 200);
  };

  get: RouteHandler<typeof getSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const result = await this.getUseCase.execute(
      organizationId,
      id,
      c.get('userId')
    );
    return c.json(result, 200);
  };

  getIdentifiers: RouteHandler<typeof getSubjectGroupIdentifiersRoute, AppEnv> =
    async (c) => {
      const { organizationId } = c.req.valid('param');
      const identifiers = await this.getIdentifiersUseCase.execute(
        organizationId,
        c.get('userId')
      );
      return c.json(identifiers, 200);
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
      const { organizationId } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await this.bulkCreateUseCase.execute(
        organizationId,
        c.get('userId'),
        body
      );
      return c.json(result, 201);
    };

  update: RouteHandler<typeof updateSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.updateUseCase.execute(
      organizationId,
      id,
      c.get('userId'),
      body
    );
    return c.json(result, 200);
  };

  delete: RouteHandler<typeof deleteSubjectGroupRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    await this.deleteUseCase.execute(organizationId, id, c.get('userId'));
    return c.body(null, 204);
  };

  deleteAll: RouteHandler<typeof deleteAllSubjectGroupsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    await this.deleteAllUseCase.execute(organizationId, c.get('userId'));
    return c.body(null, 204);
  };
}
