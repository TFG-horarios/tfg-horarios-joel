import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleDegreeRepository } from './infrastructure/db/drizzle.degree.repository';
import { CreateDegreeUseCase } from './application/create-degree.usecase';
import { BulkCreateDegreesUseCase } from './application/bulk-create-degree.usecase';
import { GetDegreeUseCase } from './application/get-degree.usecase';
import { ListDegreesUseCase } from './application/list-degree.usecase';
import { ListAllDegreesUseCase } from './application/list-all-degrees.usecase';
import { GetDegreeIdentifiersUseCase } from './application/get-degree-identifiers.usecase';
import { UpdateDegreeUseCase } from './application/update-degree.usecase';
import { DeleteDegreeUseCase } from './application/delete-degree.usecase';
import { DeleteAllDegreesUseCase } from './application/delete-all-degrees.usecase';
import { ReplaceDegreesUseCase } from './application/replace-degrees.usecase';
import { HonoDegreeController } from './infrastructure/http/hono.degree.controller';
import {
  createDegreeRoute,
  bulkCreateDegreesRoute,
  getDegreeRoute,
  listDegreesRoute,
  listAllDegreesRoute,
  updateDegreeRoute,
  deleteDegreeRoute,
  deleteAllDegreesRoute,
  replaceDegreesRoute,
  getDegreeIdentifiersRoute,
} from './infrastructure/http/hono.degree.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { DegreeScheduleAdapter } from './infrastructure/adapters/degree-schedule.adapter';
import { DegreeMemberAdapter } from './infrastructure/adapters/degree-member.adapter';
import { DegreeAcademicYearAdapter } from './infrastructure/adapters/degree-academic-year.adapter';

export const createDegreeModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const degreeRepository = new DrizzleDegreeRepository(db);
  const memberProvider = new DegreeMemberAdapter(memberRepository);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const scheduleProvider = new DegreeScheduleAdapter(
    new DrizzleScheduleRepository(db)
  );
  const academicYearProvider = new DegreeAcademicYearAdapter(
    academicYearRepository
  );

  const runInTransaction = <T>(work: (tx: any) => Promise<T>) =>
    db.transaction(work);

  const controller = new HonoDegreeController(
    new CreateDegreeUseCase(degreeRepository, memberProvider),
    new BulkCreateDegreesUseCase(degreeRepository, memberProvider),
    new GetDegreeUseCase(
      degreeRepository,
      memberProvider,
      academicYearProvider
    ),
    new ListDegreesUseCase(degreeRepository, memberProvider),
    new UpdateDegreeUseCase(degreeRepository, memberProvider),
    new DeleteDegreeUseCase(
      degreeRepository,
      memberProvider,
      academicYearRepository,
      scheduleProvider,
      runInTransaction
    ),
    new DeleteAllDegreesUseCase(
      degreeRepository,
      memberProvider,
      academicYearRepository,
      scheduleProvider,
      runInTransaction
    ),
    new ReplaceDegreesUseCase(degreeRepository, memberProvider),
    new GetDegreeIdentifiersUseCase(degreeRepository, memberProvider),
    new ListAllDegreesUseCase(
      degreeRepository,
      memberProvider,
      academicYearProvider
    )
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllDegreesRoute, controller.listAll)
    .openapi(listDegreesRoute, controller.list)
    .openapi(getDegreeIdentifiersRoute, controller.getIdentifiers)
    .openapi(getDegreeRoute, controller.get)
    .openapi(createDegreeRoute, controller.create)
    .openapi(bulkCreateDegreesRoute, controller.bulkCreate)
    .openapi(replaceDegreesRoute, controller.replace)
    .openapi(updateDegreeRoute, controller.update)
    .openapi(deleteDegreeRoute, controller.delete)
    .openapi(deleteAllDegreesRoute, controller.deleteAll);

  return routes;
};
