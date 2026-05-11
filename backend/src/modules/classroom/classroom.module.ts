import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleClassroomRepository } from './infrastructure/db/drizzle.classroom.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { CreateClassroomUseCase } from './application/create-classroom.usecase';
import { HonoClassroomController } from './infrastructure/http/hono.classroom.controller';
import {
  createClassroomRoute,
  listClassroomsRoute,
  deleteClassroomRoute,
  updateClassroomRoute,
  getClassroomRoute,
  createManyClassroomsRoute,
} from './infrastructure/http/hono.classroom.routes';
import { DeleteClassroomUseCase } from './application/delete-classroom.usecase';
import { UpdateClassroomUseCase } from './application/update-classroom.usecase';
import { ListClassroomsUseCase } from './application/list-classroom.usecase';
import { GetClassroomUseCase } from './application/get-classroom.usecase';
import { BulkCreateClassroomsUseCase } from './application/bulk-create-classroom.usecase';

export const createClassroomModule = (db: DbConnection) => {
  const classroomRepository = new DrizzleClassroomRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const createUseCase = new CreateClassroomUseCase(
    classroomRepository,
    memberRepository
  );
  const listUseCase = new ListClassroomsUseCase(
    classroomRepository,
    memberRepository
  );
  const updateUseCase = new UpdateClassroomUseCase(
    classroomRepository,
    memberRepository
  );
  const deleteUseCase = new DeleteClassroomUseCase(
    classroomRepository,
    memberRepository
  );
  const getUseCase = new GetClassroomUseCase(
    classroomRepository,
    memberRepository
  );

  const createManyUseCase = new BulkCreateClassroomsUseCase(
    classroomRepository,
    memberRepository
  );

  const controller = new HonoClassroomController(
    createUseCase,
    listUseCase,
    updateUseCase,
    deleteUseCase,
    getUseCase,
    createManyUseCase
  );
  const router = new OpenAPIHono<AppEnv>();

  router.openapi(createClassroomRoute, controller.create);
  router.openapi(listClassroomsRoute, controller.list);
  router.openapi(updateClassroomRoute, controller.update);
  router.openapi(deleteClassroomRoute, controller.delete);
  router.openapi(getClassroomRoute, controller.get);
  router.openapi(createManyClassroomsRoute, controller.createMany);

  return router;
};
