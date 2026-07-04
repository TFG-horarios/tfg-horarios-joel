import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleSubjectGroupRepository } from './infrastructure/db/drizzle.subject-group.repository';
import { HonoSubjectGroupController } from './infrastructure/http/hono.subject-group.controller';
import {
  listSubjectGroupsRoute,
  listAllSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
  deleteAllSubjectGroupsRoute,
  replaceSubjectGroupsRoute,
  getSubjectGroupIdentifiersRoute,
} from './infrastructure/http/hono.subject-group.routes';
import { BulkCreateSubjectGroupUseCase } from './application/bulk-create-subject-group.usecase';
import { CreateSubjectGroupUseCase } from './application/create-subject-group.usecase';
import { DeleteSubjectGroupUseCase } from './application/delete-subject-group.usecase';
import { GetSubjectGroupUseCase } from './application/get-subject-group.usecase';
import { ListSubjectGroupsUseCase } from './application/list-subject-group.usecase';
import { ListAllSubjectGroupsUseCase } from './application/list-all-subject-groups.usecase';
import { UpdateSubjectGroupUseCase } from './application/update-subject-group.usecase';
import { DeleteAllSubjectGroupsUseCase } from './application/delete-all-subject-groups.usecase';
import { ReplaceSubjectGroupsUseCase } from './application/replace-subject-groups.usecase';
import { GetSubjectGroupIdentifiersUseCase } from './application/get-subject-group-identifiers.usecase';
import type { IMemberRepository } from '../member/domain/member.repository';
import type { ISubjectRepository } from '../subject/domain/subject.repository';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { SubjectGroupScheduleAdapter } from './infrastructure/adapters/subject-group-schedule.adapter';
import { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { SubjectAdapter } from './infrastructure/adapters/subject.adapter';
import { SubjectGroupAcademicYearAdapter } from './infrastructure/adapters/subject-group-academic-year.adapter';
import { ScheduleIssueAdapter } from '@/modules/schedule/infrastructure/adapters/schedule-issue.adapter';

export const createSubjectGroupModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  subjectRepository: ISubjectRepository
) => {
  const subjectGroupRepository = new DrizzleSubjectGroupRepository(db);
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const subjectProvider = new SubjectAdapter(subjectRepository);
  const scheduleRepository = new DrizzleScheduleRepository(db);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const scheduleProvider = new SubjectGroupScheduleAdapter(scheduleRepository);
  const academicYearProvider = new SubjectGroupAcademicYearAdapter(
    academicYearRepository
  );
  const reevaluateSchedules = new ReevaluateSchedulesUseCase(
    scheduleRepository,
    new ScheduleIssueAdapter()
  );
  const runInTransaction = <T>(work: (tx: any) => Promise<T>) =>
    db.transaction(work);

  const listUseCase = new ListSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider
  );

  const listAllUseCase = new ListAllSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider,
    academicYearProvider
  );

  const getUseCase = new GetSubjectGroupUseCase(
    subjectGroupRepository,
    memberProvider
  );

  const createUseCase = new CreateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider,
    academicYearRepository,
    scheduleProvider,
    reevaluateSchedules,
    runInTransaction
  );

  const bulkCreateUseCase = new BulkCreateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider,
    academicYearRepository,
    scheduleProvider,
    reevaluateSchedules,
    runInTransaction
  );

  const updateUseCase = new UpdateSubjectGroupUseCase(
    subjectGroupRepository,
    subjectProvider,
    memberProvider
  );

  const deleteUseCase = new DeleteSubjectGroupUseCase(
    subjectGroupRepository,
    memberProvider,
    academicYearRepository,
    scheduleProvider,
    reevaluateSchedules,
    runInTransaction
  );

  const deleteAllUseCase = new DeleteAllSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider,
    academicYearRepository,
    scheduleProvider,
    reevaluateSchedules,
    runInTransaction
  );

  const replaceUseCase = new ReplaceSubjectGroupsUseCase(
    subjectGroupRepository,
    memberProvider,
    subjectProvider,
    academicYearRepository,
    scheduleProvider,
    reevaluateSchedules,
    runInTransaction
  );

  const getIdentifiersUseCase = new GetSubjectGroupIdentifiersUseCase(
    subjectGroupRepository,
    memberProvider
  );

  const controller = new HonoSubjectGroupController(
    listUseCase,
    getUseCase,
    createUseCase,
    bulkCreateUseCase,
    updateUseCase,
    deleteUseCase,
    deleteAllUseCase,
    replaceUseCase,
    getIdentifiersUseCase,
    listAllUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllSubjectGroupsRoute, controller.listAll)
    .openapi(listSubjectGroupsRoute, controller.list)
    .openapi(getSubjectGroupIdentifiersRoute, controller.getIdentifiers)
    .openapi(getSubjectGroupRoute, controller.get)
    .openapi(createSubjectGroupRoute, controller.create)
    .openapi(bulkCreateSubjectGroupsRoute, controller.bulkCreate)
    .openapi(replaceSubjectGroupsRoute, controller.replace)
    .openapi(updateSubjectGroupRoute, controller.update)
    .openapi(deleteSubjectGroupRoute, controller.delete)
    .openapi(deleteAllSubjectGroupsRoute, controller.deleteAll);
  return routes;
};
