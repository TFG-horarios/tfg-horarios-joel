import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleSubjectGroupRepository } from './infrastructure/db/drizzle.subject-group.repository';
import { HonoSubjectGroupController } from './infrastructure/http/hono.subject-group.controller';
import {
  listSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
  deleteAllSubjectGroupsRoute,
  replaceSubjectGroupsRoute,
} from './infrastructure/http/hono.subject-group.routes';
import { BulkCreateSubjectGroupUseCase } from './application/bulk-create-subject-group.usecase';
import { CreateSubjectGroupUseCase } from './application/create-subject-group.usecase';
import { DeleteSubjectGroupUseCase } from './application/delete-subject-group.usecase';
import { GetSubjectGroupUseCase } from './application/get-subject-group.usecase';
import { ListSubjectGroupsUseCase } from './application/list-subject-group.usecase';
import { UpdateSubjectGroupUseCase } from './application/update-subject-group.usecase';
import { DeleteAllSubjectGroupsUseCase } from './application/delete-all-subject-groups.usecase';
import { ReplaceSubjectGroupsUseCase } from './application/replace-subject-groups.usecase';
import type { IMemberRepository } from '../member/domain/member.repository';
import type { ISubjectRepository } from '../subject/domain/subject.repository';
import { SubjectGroupMemberAdapter } from './infrastructure/adapters/subject-group-member.adapter';
import { SubjectAdapter } from './infrastructure/adapters/subject.adapter';

export const createSubjectGroupModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  subjectRepository: ISubjectRepository
) => {
  const subjectGroupRepository = new DrizzleSubjectGroupRepository(db);
  const memberProvider = new SubjectGroupMemberAdapter(memberRepository);
  const subjectProvider = new SubjectAdapter(subjectRepository);

  const listUseCase = new ListSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider
  );
  const getUseCase = new GetSubjectGroupUseCase(
    subjectGroupRepository,
    memberProvider
  );
  const createUseCase = new CreateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider
  );
  const bulkCreateUseCase = new BulkCreateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider
  );
  const updateUseCase = new UpdateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider
  );
  const deleteUseCase = new DeleteSubjectGroupUseCase(
    subjectGroupRepository,
    memberProvider
  );
  const deleteAllUseCase = new DeleteAllSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider
  );
  const replaceUseCase = new ReplaceSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider,
    subjectProvider
  );

  const controller = new HonoSubjectGroupController(
    listUseCase,
    getUseCase,
    createUseCase,
    bulkCreateUseCase,
    updateUseCase,
    deleteUseCase,
    deleteAllUseCase,
    replaceUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listSubjectGroupsRoute, controller.list)
    .openapi(getSubjectGroupRoute, controller.get)
    .openapi(createSubjectGroupRoute, controller.create)
    .openapi(bulkCreateSubjectGroupsRoute, controller.bulkCreate)
    .openapi(replaceSubjectGroupsRoute, controller.replace)
    .openapi(updateSubjectGroupRoute, controller.update)
    .openapi(deleteSubjectGroupRoute, controller.delete)
    .openapi(deleteAllSubjectGroupsRoute, controller.deleteAll);
  return routes;
};
