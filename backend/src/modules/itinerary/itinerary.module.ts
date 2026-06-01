import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleItineraryRepository } from './infrastructure/db/drizzle.itinerary.repository';
import { CreateItineraryUseCase } from './application/create-itinerary.usecase';
import { BulkCreateItinerariesUseCase } from './application/bulk-create-itinerary.usecase';
import { GetItineraryUseCase } from './application/get-itinerary.usecase';
import { ListItinerariesUseCase } from './application/list-itinerary.usecase';
import { UpdateItineraryUseCase } from './application/update-itinerary.usecase';
import { DeleteItineraryUseCase } from './application/delete-itinerary.usecase';
import { DeleteAllItinerariesUseCase } from './application/delete-all-itineraries.usecase';
import { ReplaceItinerariesUseCase } from './application/replace-itineraries.usecase';
import { HonoItineraryController } from './infrastructure/http/hono.itinerary.controller';
import {
  createItineraryRoute,
  bulkCreateItinerariesRoute,
  getItineraryRoute,
  listItinerariesRoute,
  updateItineraryRoute,
  deleteItineraryRoute,
  deleteAllItinerariesRoute,
  replaceItinerariesRoute,
} from './infrastructure/http/hono.itinerary.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ItineraryMemberAdapter } from './infrastructure/adapters/itinerary-member.adapter';

export const createItineraryModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const itineraryRepository = new DrizzleItineraryRepository(db);
  const memberProvider = new ItineraryMemberAdapter(memberRepository);

  const controller = new HonoItineraryController(
    new CreateItineraryUseCase(itineraryRepository, memberProvider),
    new BulkCreateItinerariesUseCase(itineraryRepository, memberProvider),
    new GetItineraryUseCase(itineraryRepository, memberProvider),
    new ListItinerariesUseCase(itineraryRepository, memberProvider),
    new UpdateItineraryUseCase(itineraryRepository, memberProvider),
    new DeleteItineraryUseCase(itineraryRepository, memberProvider),
    new DeleteAllItinerariesUseCase(itineraryRepository, memberProvider),
    new ReplaceItinerariesUseCase(itineraryRepository, memberProvider)
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listItinerariesRoute, controller.list)
    .openapi(getItineraryRoute, controller.get)
    .openapi(createItineraryRoute, controller.create)
    .openapi(bulkCreateItinerariesRoute, controller.bulkCreate)
    .openapi(replaceItinerariesRoute, controller.replace)
    .openapi(updateItineraryRoute, controller.update)
    .openapi(deleteItineraryRoute, controller.delete)
    .openapi(deleteAllItinerariesRoute, controller.deleteAll);
  return routes;
};
