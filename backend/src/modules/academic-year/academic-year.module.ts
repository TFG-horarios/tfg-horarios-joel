import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleAcademicYearRepository } from './infrastructure/db/drizzle.academic-year.repository';
import { DrizzleOrganizationRepository } from '@/modules/organization/infrastructure/db/drizzle.organization.repository';
import { CreateAcademicYearUseCase } from './application/create-academic-year.usecase';
import { UpdateAcademicYearUseCase } from './application/update-academic-year.usecase';
import { ListAcademicYearsUseCase } from './application/list-academic-years.usecase';
import { GetActiveAcademicYearUseCase } from './application/get-active-academic-year.usecase';
import { HonoAcademicYearController } from './infrastructure/http/hono.academic-year.controller';
import {
  createAcademicYearRoute,
  listAcademicYearsRoute,
  getActiveAcademicYearRoute,
  updateAcademicYearRoute,
} from './infrastructure/http/hono.academic-year.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { AcademicYearMemberAdapter } from './infrastructure/adapters/academic-year-member.adapter';
import { AcademicYearOrganizationAdapter } from './infrastructure/adapters/academic-year-organization.adapter';

export function createAcademicYearModule(
  db: DbConnection,
  memberRepository: IMemberRepository
) {
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const organizationRepository = new DrizzleOrganizationRepository(db);
  const memberProvider = new AcademicYearMemberAdapter(memberRepository);
  const organizationProvider = new AcademicYearOrganizationAdapter(
    organizationRepository
  );

  const createUseCase = new CreateAcademicYearUseCase(
    academicYearRepository,
    organizationProvider,
    memberProvider
  );
  const updateUseCase = new UpdateAcademicYearUseCase(
    academicYearRepository,
    memberProvider
  );
  const listUseCase = new ListAcademicYearsUseCase(
    academicYearRepository,
    memberProvider
  );
  const getActiveUseCase = new GetActiveAcademicYearUseCase(
    academicYearRepository,
    memberProvider
  );

  const controller = new HonoAcademicYearController(
    createUseCase,
    listUseCase,
    getActiveUseCase,
    updateUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createAcademicYearRoute, controller.create)
    .openapi(listAcademicYearsRoute, controller.list)
    .openapi(getActiveAcademicYearRoute, controller.getActive)
    .openapi(updateAcademicYearRoute, controller.update);

  return routes;
}
