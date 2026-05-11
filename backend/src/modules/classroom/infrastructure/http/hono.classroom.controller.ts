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
} from './hono.classroom.routes';
import { ListClassroomsUseCase } from '../../application/list-classroom.usecase';
import { UpdateClassroomUseCase } from '../../application/update-classroom.usecase';
import { DeleteClassroomUseCase } from '../../application/delete-classroom.usecase';
import { GetClassroomUseCase } from '../../application/get-classroom.usecase';
import { BulkCreateClassroomsUseCase } from '../../application/bulk-create-classroom.usecase';

export class HonoClassroomController {
  constructor(
    private readonly createClassroomUseCase: CreateClassroomUseCase,
    private readonly listClassroomsUseCase: ListClassroomsUseCase,
    private readonly updateClassroomUseCase: UpdateClassroomUseCase,
    private readonly deleteClassroomUseCase: DeleteClassroomUseCase,
    private readonly getClassroomUseCase: GetClassroomUseCase,
    private readonly bulkCreateClassroomsUseCase: BulkCreateClassroomsUseCase
  ) {}

  get: RouteHandler<typeof getClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, classroomId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const classroom = await this.getClassroomUseCase.execute(
      organizationId,
      classroomId,
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

  list: RouteHandler<typeof listClassroomsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const classrooms = await this.listClassroomsUseCase.execute(
      organizationId,
      requesterUserId
    );
    return c.json(classrooms, 200);
  };

  update: RouteHandler<typeof updateClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, classroomId } = c.req.valid('param');
    const body = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const updatedClassroom = await this.updateClassroomUseCase.execute(
      organizationId,
      classroomId,
      requesterUserId,
      body
    );
    return c.json(updatedClassroom, 200);
  };

  delete: RouteHandler<typeof deleteClassroomRoute, AppEnv> = async (c) => {
    const { organizationId, classroomId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.deleteClassroomUseCase.execute(
      organizationId,
      classroomId,
      requesterUserId
    );
    return c.json({ message: 'Classroom deleted successfully' });
  };
}
