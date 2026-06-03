import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import { CreateClassroomUseCase } from '../../application/create-classroom.usecase';
import {
  createClassroomRoute,
  listClassroomsRoute,
  updateClassroomRoute,
  deleteClassroomRoute,
  getClassroomRoute,
  createManyClassroomsRoute,
  deleteAllClassroomsRoute,
  replaceClassroomsRoute,
  getClassroomIdentifiersRoute,
  listAllClassroomsRoute,
} from './hono.classroom.routes';
import { ListClassroomsUseCase } from '../../application/list-classroom.usecase';
import { ListAllClassroomsUseCase } from '../../application/list-all-classrooms.usecase';
import { GetClassroomIdentifiersUseCase } from '../../application/get-classroom-identifiers.usecase';
import { UpdateClassroomUseCase } from '../../application/update-classroom.usecase';
import { DeleteClassroomUseCase } from '../../application/delete-classroom.usecase';
import { GetClassroomUseCase } from '../../application/get-classroom.usecase';
import { BulkCreateClassroomsUseCase } from '../../application/bulk-create-classroom.usecase';
import { DeleteAllClassroomsUseCase } from '../../application/delete-all-classrooms.usecase';
import { ReplaceClassroomsUseCase } from '../../application/replace-classrooms.usecase';

export class HonoClassroomController {
  constructor(
    private readonly createClassroomUseCase: CreateClassroomUseCase,
    private readonly listClassroomsUseCase: ListClassroomsUseCase,
    private readonly updateClassroomUseCase: UpdateClassroomUseCase,
    private readonly deleteClassroomUseCase: DeleteClassroomUseCase,
    private readonly getClassroomUseCase: GetClassroomUseCase,
    private readonly bulkCreateClassroomsUseCase: BulkCreateClassroomsUseCase,
    private readonly deleteAllClassroomsUseCase: DeleteAllClassroomsUseCase,
    private readonly replaceClassroomsUseCase: ReplaceClassroomsUseCase,
    private readonly getClassroomIdentifiersUseCase: GetClassroomIdentifiersUseCase,
    private readonly listAllClassroomsUseCase: ListAllClassroomsUseCase
  ) {}

  get: RouteHandler<typeof getClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const classroom = await this.getClassroomUseCase.execute(
      organizationId,
      id,
      requesterUserId
    );
    return c.json(classroom, 200);
  };

  create: RouteHandler<typeof createClassroomRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const newClassroom = await this.createClassroomUseCase.execute(
      organizationId,
      requesterUserId,
      body
    );
    return c.json(newClassroom, 201);
  };

  createMany: RouteHandler<typeof createManyClassroomsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const newClassrooms = await this.bulkCreateClassroomsUseCase.execute(
      organizationId,
      requesterUserId,
      bodyArray
    );
    return c.json(newClassrooms, 201);
  };

  replace: RouteHandler<typeof replaceClassroomsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const replacedClassrooms = await this.replaceClassroomsUseCase.execute(
      organizationId,
      requesterUserId,
      bodyArray
    );
    return c.json(replacedClassrooms, 200);
  };

  list: RouteHandler<typeof listClassroomsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const requesterUserId = c.get('userId');
    const classrooms = await this.listClassroomsUseCase.execute(
      organizationId,
      requesterUserId,
      query
    );
    return c.json(classrooms, 200);
  };

  getIdentifiers: RouteHandler<typeof getClassroomIdentifiersRoute, AppEnv> =
    async (c) => {
      const { organizationId } = c.req.valid('param');
      const requesterUserId = c.get('userId');
      const identifiers = await this.getClassroomIdentifiersUseCase.execute(
        organizationId,
        requesterUserId
      );
      return c.json(identifiers, 200);
    };

  update: RouteHandler<typeof updateClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const body = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const updatedClassroom = await this.updateClassroomUseCase.execute(
      organizationId,
      id,
      requesterUserId,
      body
    );
    return c.json(updatedClassroom, 200);
  };

  delete: RouteHandler<typeof deleteClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.deleteClassroomUseCase.execute(
      organizationId,
      id,
      requesterUserId
    );
    return c.json({ message: 'Classroom deleted successfully' });
  };

  deleteAll: RouteHandler<typeof deleteAllClassroomsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.deleteAllClassroomsUseCase.execute(
      organizationId,
      requesterUserId
    );
    return c.json({ message: 'All classrooms deleted successfully' });
  };

  listAll: RouteHandler<typeof listAllClassroomsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const classrooms = await this.listAllClassroomsUseCase.execute(
      organizationId,
      requesterUserId
    );
    return c.json(classrooms, 200);
  };
}
