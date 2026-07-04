import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleSubjectRepository } from './infrastructure/db/drizzle.subject.repository';
import { CreateSubjectUseCase } from './application/create-subject.usecase';
import { BulkCreateSubjectUseCase } from './application/bulk-create-subject.usecase';
import { GetSubjectUseCase } from './application/get-subject.usecase';
import { ListSubjectUseCase } from './application/list-subject.usecase';
import { ListAllSubjectsUseCase } from './application/list-all-subjects.usecase';
import { UpdateSubjectUseCase } from './application/update-subject.usecase';
import { DeleteSubjectUseCase } from './application/delete-subject.usecase';
import { DeleteAllSubjectsUseCase } from './application/delete-all-subjects.usecase';
import { ReplaceSubjectsUseCase } from './application/replace-subjects.usecase';
import { GetSubjectIdentifiersUseCase } from './application/get-subject-identifiers.usecase';
import { HonoSubjectController } from './infrastructure/http/hono.subject.controller';
import {
  createSubjectRoute,
  bulkCreateSubjectsRoute,
  getSubjectRoute,
  listSubjectsRoute,
  listAllSubjectsRoute,
  updateSubjectRoute,
  deleteSubjectRoute,
  deleteAllSubjectsRoute,
  replaceSubjectsRoute,
  getSubjectIdentifiersRoute,
} from './infrastructure/http/hono.subject.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { SubjectScheduleAdapter } from './infrastructure/adapters/subject-schedule.adapter';
import { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { SubjectAcademicYearAdapter } from './infrastructure/adapters/subject-academic-year.adapter';
import { ScheduleIssueAdapter } from '@/modules/schedule/infrastructure/adapters/schedule-issue.adapter';

export const createSubjectModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const subjectRepository = new DrizzleSubjectRepository(db);
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const scheduleRepository = new DrizzleScheduleRepository(db);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const scheduleProvider = new SubjectScheduleAdapter(scheduleRepository);
  const academicYearProvider = new SubjectAcademicYearAdapter(
    academicYearRepository
  );
  const reevaluateSchedules = new ReevaluateSchedulesUseCase(
    scheduleRepository,
    new ScheduleIssueAdapter()
  );
  const runInTransaction = <T>(work: (tx: any) => Promise<T>) =>
    db.transaction(work);

  const controller = new HonoSubjectController(
    new CreateSubjectUseCase(subjectRepository, memberProvider),
    new BulkCreateSubjectUseCase(subjectRepository, memberProvider),
    new GetSubjectUseCase(subjectRepository, memberProvider),
    new ListSubjectUseCase(subjectRepository, memberProvider),
    new UpdateSubjectUseCase(subjectRepository, memberProvider),
    new DeleteSubjectUseCase(
      subjectRepository,
      memberProvider,
      academicYearRepository,
      scheduleProvider,
      reevaluateSchedules,
      runInTransaction
    ),
    new DeleteAllSubjectsUseCase(
      subjectRepository,
      memberProvider,
      academicYearRepository,
      scheduleProvider,
      reevaluateSchedules,
      runInTransaction
    ),
    new ReplaceSubjectsUseCase(subjectRepository, memberProvider),
    new GetSubjectIdentifiersUseCase(subjectRepository, memberProvider),
    new ListAllSubjectsUseCase(
      subjectRepository,
      memberProvider,
      academicYearProvider
    )
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllSubjectsRoute, controller.listAll)
    .openapi(listSubjectsRoute, controller.list)
    .openapi(getSubjectIdentifiersRoute, controller.getIdentifiers)
    .openapi(getSubjectRoute, controller.get)
    .openapi(createSubjectRoute, controller.create)
    .openapi(bulkCreateSubjectsRoute, controller.bulkCreate)
    .openapi(replaceSubjectsRoute, controller.replace)
    .openapi(updateSubjectRoute, controller.update)
    .openapi(deleteSubjectRoute, controller.delete)
    .openapi(deleteAllSubjectsRoute, controller.deleteAll);
  return routes;
};
