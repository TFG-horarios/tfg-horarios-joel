import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleItineraryRepository } from './infrastructure/db/drizzle.itinerary.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { CreateItineraryUseCase } from './application/create-itinerary.usecase';
import { BulkCreateItinerariesUseCase } from './application/bulk-create-itinerary.usecase';
import { GetItineraryUseCase } from './application/get-itinerary.usecase';
import { ListItinerariesUseCase } from './application/list-itinerary.usecase';
import { UpdateItineraryUseCase } from './application/update-itinerary.usecase';
import { DeleteItineraryUseCase } from './application/delete-itinerary.usecase';
import { HonoItineraryController } from './infrastructure/http/hono.itinerary.controller';
import {
  createItineraryRoute,
  bulkCreateItinerariesRoute,
  getItineraryRoute,
  listItinerariesRoute,
  updateItineraryRoute,
  deleteItineraryRoute,
} from './infrastructure/http/hono.itinerary.routes';

export const createItineraryModule = (db: DbConnection) => {
  const itineraryRepository = new DrizzleItineraryRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const controller = new HonoItineraryController(
    new CreateItineraryUseCase(itineraryRepository, memberRepository),
    new BulkCreateItinerariesUseCase(itineraryRepository, memberRepository),
    new GetItineraryUseCase(itineraryRepository, memberRepository),
    new ListItinerariesUseCase(itineraryRepository, memberRepository),
    new UpdateItineraryUseCase(itineraryRepository, memberRepository),
    new DeleteItineraryUseCase(itineraryRepository, memberRepository)
  );

  const router = new OpenAPIHono<AppEnv>();

  router.openapi(listItinerariesRoute, controller.list);
  router.openapi(getItineraryRoute, controller.get);
  router.openapi(createItineraryRoute, controller.create);
  router.openapi(bulkCreateItinerariesRoute, controller.bulkCreate);
  router.openapi(updateItineraryRoute, controller.update);
  router.openapi(deleteItineraryRoute, controller.delete);

  return router;
};
