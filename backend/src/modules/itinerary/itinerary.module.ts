import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleItineraryRepository } from './infrastructure/db/drizzle.itinerary.repository';
import { CreateItineraryUseCase } from './application/create-itinerary.usecase';
import { BulkCreateItinerariesUseCase } from './application/bulk-create-itinerary.usecase';
import { GetItineraryUseCase } from './application/get-itinerary.usecase';
import { ListItinerariesUseCase } from './application/list-itinerary.usecase';
import { ListAllItinerariesUseCase } from './application/list-all-itineraries.usecase';
import { UpdateItineraryUseCase } from './application/update-itinerary.usecase';
import { DeleteItineraryUseCase } from './application/delete-itinerary.usecase';
import { DeleteAllItinerariesUseCase } from './application/delete-all-itineraries.usecase';
import { ReplaceItinerariesUseCase } from './application/replace-itineraries.usecase';
import { GetItineraryIdentifiersUseCase } from './application/get-itinerary-identifiers.usecase';
import { HonoItineraryController } from './infrastructure/http/hono.itinerary.controller';
import {
  createItineraryRoute,
  bulkCreateItinerariesRoute,
  getItineraryRoute,
  listItinerariesRoute,
  listAllItinerariesRoute,
  updateItineraryRoute,
  deleteItineraryRoute,
  deleteAllItinerariesRoute,
  replaceItinerariesRoute,
  getItineraryIdentifiersRoute,
} from './infrastructure/http/hono.itinerary.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { ScheduleAdapter } from './infrastructure/adapters/schedule.adapter';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';

export const createItineraryModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const itineraryRepository = new DrizzleItineraryRepository(db);
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const scheduleProvider = new ScheduleAdapter(
    new DrizzleScheduleRepository(db)
  );
  const academicYearProvider = new AcademicYearAdapter(academicYearRepository);

  const runInTransaction: TransactionRunner = (work) => db.transaction(work);

  const controller = new HonoItineraryController(
    new CreateItineraryUseCase(itineraryRepository, memberProvider),
    new BulkCreateItinerariesUseCase(itineraryRepository, memberProvider),
    new GetItineraryUseCase(
      itineraryRepository,
      memberProvider,
      academicYearProvider
    ),
    new ListItinerariesUseCase(itineraryRepository, memberProvider),
    new UpdateItineraryUseCase(itineraryRepository, memberProvider),
    new DeleteItineraryUseCase(
      itineraryRepository,
      memberProvider,
      academicYearProvider,
      scheduleProvider,
      runInTransaction
    ),
    new DeleteAllItinerariesUseCase(
      itineraryRepository,
      memberProvider,
      academicYearProvider,
      scheduleProvider,
      runInTransaction
    ),
    new ReplaceItinerariesUseCase(itineraryRepository, memberProvider),
    new GetItineraryIdentifiersUseCase(itineraryRepository, memberProvider),
    new ListAllItinerariesUseCase(
      itineraryRepository,
      memberProvider,
      academicYearProvider
    )
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllItinerariesRoute, controller.listAll)
    .openapi(listItinerariesRoute, controller.list)
    .openapi(getItineraryIdentifiersRoute, controller.getIdentifiers)
    .openapi(getItineraryRoute, controller.get)
    .openapi(createItineraryRoute, controller.create)
    .openapi(bulkCreateItinerariesRoute, controller.bulkCreate)
    .openapi(replaceItinerariesRoute, controller.replace)
    .openapi(updateItineraryRoute, controller.update)
    .openapi(deleteItineraryRoute, controller.delete)
    .openapi(deleteAllItinerariesRoute, controller.deleteAll);
  return routes;
};
