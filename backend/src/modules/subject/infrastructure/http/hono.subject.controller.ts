import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { CreateSubjectUseCase } from '../../application/create-subject.usecase';
import type { BulkCreateSubjectUseCase } from '../../application/bulk-create-subject.usecase';
import type { GetSubjectUseCase } from '../../application/get-subject.usecase';
import type { ListSubjectUseCase } from '../../application/list-subject.usecase';
import type { UpdateSubjectUseCase } from '../../application/update-subject.usecase';
import type { DeleteSubjectUseCase } from '../../application/delete-subject.usecase';
import type {
  createSubjectRoute,
  bulkCreateSubjectsRoute,
  getSubjectRoute,
  listSubjectsRoute,
  updateSubjectRoute,
  deleteSubjectRoute,
  deleteAllSubjectsRoute,
  replaceSubjectsRoute,
  getSubjectIdentifiersRoute,
  listAllSubjectsRoute,
} from './hono.subject.routes';
import type { DeleteAllSubjectsUseCase } from '../../application/delete-all-subjects.usecase';
import type { ReplaceSubjectsUseCase } from '../../application/replace-subjects.usecase';
import type { GetSubjectIdentifiersUseCase } from '../../application/get-subject-identifiers.usecase';
import type { ListAllSubjectsUseCase } from '../../application/list-all-subjects.usecase';

export class HonoSubjectController {
  constructor(
    private readonly createUseCase: CreateSubjectUseCase,
    private readonly bulkCreateUseCase: BulkCreateSubjectUseCase,
    private readonly getUseCase: GetSubjectUseCase,
    private readonly listUseCase: ListSubjectUseCase,
    private readonly updateUseCase: UpdateSubjectUseCase,
    private readonly deleteUseCase: DeleteSubjectUseCase,
    private readonly deleteAllUseCase: DeleteAllSubjectsUseCase,
    private readonly replaceUseCase: ReplaceSubjectsUseCase,
    private readonly getIdentifiersUseCase: GetSubjectIdentifiersUseCase,
    private readonly listAllUseCase: ListAllSubjectsUseCase
  ) {}

  list: RouteHandler<typeof listSubjectsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const subjects = await this.listUseCase.execute(
      organizationId,
      c.get('userId'),
      query
    );
    return c.json(subjects, 200);
  };

  listAll: RouteHandler<typeof listAllSubjectsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const subjects = await this.listAllUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(subjects, 200);
  };

  getIdentifiers: RouteHandler<typeof getSubjectIdentifiersRoute, AppEnv> =
    async (c) => {
      const { organizationId } = c.req.valid('param');
      const identifiers = await this.getIdentifiersUseCase.execute(
        organizationId,
        c.get('userId')
      );
      return c.json(identifiers, 200);
    };

  create: RouteHandler<typeof createSubjectRoute, AppEnv> = async (c) => {
    const { organizationId, degreeId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.createUseCase.execute(
      organizationId,
      degreeId,
      c.get('userId'),
      body
    );
    return c.json(result, 201);
  };

  bulkCreate: RouteHandler<typeof bulkCreateSubjectsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.bulkCreateUseCase.execute(
      organizationId,
      c.get('userId'),
      body
    );
    return c.json(result, 201);
  };

  replace: RouteHandler<typeof replaceSubjectsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await this.replaceUseCase.execute(
      organizationId,
      c.get('userId'),
      body
    );
    return c.json(result, 200);
  };

  get: RouteHandler<typeof getSubjectRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const result = await this.getUseCase.execute(
      organizationId,
      id,
      c.get('userId')
    );
    return c.json(result, 200);
  };

  update: RouteHandler<typeof updateSubjectRoute, AppEnv> = async (c) => {
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

  delete: RouteHandler<typeof deleteSubjectRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    await this.deleteUseCase.execute(organizationId, id, c.get('userId'));
    return c.body(null, 204);
  };

  deleteAll: RouteHandler<typeof deleteAllSubjectsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    await this.deleteAllUseCase.execute(organizationId, c.get('userId'));
    return c.body(null, 204);
  };
}
