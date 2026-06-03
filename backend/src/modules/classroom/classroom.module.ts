import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleClassroomRepository } from './infrastructure/db/drizzle.classroom.repository';
import { CreateClassroomUseCase } from './application/create-classroom.usecase';
import { HonoClassroomController } from './infrastructure/http/hono.classroom.controller';
import {
  createClassroomRoute,
  listClassroomsRoute,
  deleteClassroomRoute,
  updateClassroomRoute,
  getClassroomRoute,
  createManyClassroomsRoute,
  deleteAllClassroomsRoute,
  replaceClassroomsRoute,
  getClassroomIdentifiersRoute,
  listAllClassroomsRoute,
} from './infrastructure/http/hono.classroom.routes';
import { DeleteClassroomUseCase } from './application/delete-classroom.usecase';
import { UpdateClassroomUseCase } from './application/update-classroom.usecase';
import { ListClassroomsUseCase } from './application/list-classroom.usecase';
import { ListAllClassroomsUseCase } from './application/list-all-classrooms.usecase';
import { GetClassroomIdentifiersUseCase } from './application/get-classroom-identifiers.usecase';
import { GetClassroomUseCase } from './application/get-classroom.usecase';
import { BulkCreateClassroomsUseCase } from './application/bulk-create-classroom.usecase';
import { DeleteAllClassroomsUseCase } from './application/delete-all-classrooms.usecase';
import { ReplaceClassroomsUseCase } from './application/replace-classrooms.usecase';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ClassroomMemberAdapter } from './infrastructure/adapters/classroom-member.adapter';

export const createClassroomModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const classroomRepository = new DrizzleClassroomRepository(db);
  const memberProvider = new ClassroomMemberAdapter(memberRepository);

  const createUseCase = new CreateClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const listUseCase = new ListClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const listAllUseCase = new ListAllClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const getIdentifiersUseCase = new GetClassroomIdentifiersUseCase(
    classroomRepository,
    memberProvider
  );

  const updateUseCase = new UpdateClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const deleteUseCase = new DeleteClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const getUseCase = new GetClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const createManyUseCase = new BulkCreateClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const deleteAllUseCase = new DeleteAllClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const replaceUseCase = new ReplaceClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const controller = new HonoClassroomController(
    createUseCase,
    listUseCase,
    updateUseCase,
    deleteUseCase,
    getUseCase,
    createManyUseCase,
    deleteAllUseCase,
    replaceUseCase,
    getIdentifiersUseCase,
    listAllUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createClassroomRoute, controller.create)
    .openapi(createManyClassroomsRoute, controller.createMany)
    .openapi(replaceClassroomsRoute, controller.replace)
    .openapi(listClassroomsRoute, controller.list)
    .openapi(listAllClassroomsRoute, controller.listAll)
    .openapi(getClassroomIdentifiersRoute, controller.getIdentifiers)
    .openapi(getClassroomRoute, controller.get)
    .openapi(updateClassroomRoute, controller.update)
    .openapi(deleteClassroomRoute, controller.delete)
    .openapi(deleteAllClassroomsRoute, controller.deleteAll);

  return routes;
};
