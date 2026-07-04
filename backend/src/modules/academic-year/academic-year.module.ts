import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleAcademicYearRepository } from './infrastructure/db/drizzle.academic-year.repository';
import { DrizzleOrganizationRepository } from '@/modules/organization/infrastructure/db/drizzle.organization.repository';
import { CreateAcademicYearUseCase } from './application/create-academic-year.usecase';
import { UpdateAcademicYearUseCase } from './application/update-academic-year.usecase';
import { ListAcademicYearsUseCase } from './application/list-academic-years.usecase';
import { DeleteAcademicYearUseCase } from './application/delete-academic-year.usecase';
import { HonoAcademicYearController } from './infrastructure/http/hono.academic-year.controller';
import {
  createAcademicYearRoute,
  listAcademicYearsRoute,
  updateAcademicYearRoute,
  deleteAcademicYearRoute,
} from './infrastructure/http/hono.academic-year.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { OrganizationAdapter } from './infrastructure/adapters/organization.adapter';
import { AcademicYearTimingChangeAdapter } from './infrastructure/adapters/timing-change.adapter';
import type { CreateNotificationUseCase } from '../notification/application/create-notification.usecase';
import { AcademicYearNotificationAdapter } from './infrastructure/adapters/academic-year-notification.adapter';

export function createAcademicYearModule(
  db: DbConnection,
  memberRepository: IMemberRepository,
  createNotificationUseCase: CreateNotificationUseCase
) {
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const organizationRepository = new DrizzleOrganizationRepository(db);
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const organizationProvider = new OrganizationAdapter(organizationRepository);
  const notificationProvider = new AcademicYearNotificationAdapter(
    createNotificationUseCase
  );
  const timingChangeProvider = new AcademicYearTimingChangeAdapter();

  const createUseCase = new CreateAcademicYearUseCase(
    academicYearRepository,
    organizationProvider,
    memberProvider
  );
  const updateUseCase = new UpdateAcademicYearUseCase(
    academicYearRepository,
    memberProvider,
    notificationProvider,
    timingChangeProvider,
    (work) => db.transaction(async (tx) => work(tx))
  );
  const listUseCase = new ListAcademicYearsUseCase(
    academicYearRepository,
    memberProvider
  );
  const deleteUseCase = new DeleteAcademicYearUseCase(
    academicYearRepository,
    memberProvider
  );

  const controller = new HonoAcademicYearController(
    createUseCase,
    listUseCase,
    updateUseCase,
    deleteUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createAcademicYearRoute, controller.create)
    .openapi(listAcademicYearsRoute, controller.list)
    .openapi(updateAcademicYearRoute, controller.update)
    .openapi(deleteAcademicYearRoute, controller.delete);

  return routes;
}
