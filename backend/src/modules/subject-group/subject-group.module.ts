import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleSubjectGroupRepository } from './infrastructure/db/drizzle.subject-group.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { HonoSubjectGroupController } from './infrastructure/http/hono.subject-group.controller';
import {
  listSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
} from './infrastructure/http/hono.subject-group.routes';
import { BulkCreateSubjectGroupUseCase } from './application/bulk-create-subject-group.usecase';
import { CreateSubjectGroupUseCase } from './application/create-subject-group.usecase';
import { DeleteSubjectGroupUseCase } from './application/delete-subject-group.usecase';
import { GetSubjectGroupUseCase } from './application/get-subject-group.usecase';
import { ListSubjectGroupsUseCase } from './application/list-subject-group.usecase';
import { UpdateSubjectGroupUseCase } from './application/update-subject-group.usecase';

export const createSubjectGroupModule = (db: DbConnection) => {
  const subjectGroupRepository = new DrizzleSubjectGroupRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const listUseCase = new ListSubjectGroupsUseCase(
    subjectGroupRepository,
    memberRepository
  );
  const getUseCase = new GetSubjectGroupUseCase(
    subjectGroupRepository,
    memberRepository
  );
  const createUseCase = new CreateSubjectGroupUseCase(
    subjectGroupRepository,
    memberRepository
  );
  const bulkCreateUseCase = new BulkCreateSubjectGroupUseCase(
    subjectGroupRepository,
    memberRepository
  );
  const updateUseCase = new UpdateSubjectGroupUseCase(
    subjectGroupRepository,
    memberRepository
  );
  const deleteUseCase = new DeleteSubjectGroupUseCase(
    subjectGroupRepository,
    memberRepository
  );

  const controller = new HonoSubjectGroupController(
    listUseCase,
    getUseCase,
    createUseCase,
    bulkCreateUseCase,
    updateUseCase,
    deleteUseCase
  );

  const router = new OpenAPIHono<AppEnv>();

  router.openapi(listSubjectGroupsRoute, controller.list);
  router.openapi(getSubjectGroupRoute, controller.get);
  router.openapi(createSubjectGroupRoute, controller.create);
  router.openapi(bulkCreateSubjectGroupsRoute, controller.bulkCreate);
  router.openapi(updateSubjectGroupRoute, controller.update);
  router.openapi(deleteSubjectGroupRoute, controller.delete);

  return router;
};
