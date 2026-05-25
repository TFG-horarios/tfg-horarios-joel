import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { CreateItineraryUseCase } from '../../application/create-itinerary.usecase';
import type { BulkCreateItinerariesUseCase } from '../../application/bulk-create-itinerary.usecase';
import type { GetItineraryUseCase } from '../../application/get-itinerary.usecase';
import type { ListItinerariesUseCase } from '../../application/list-itinerary.usecase';
import type { UpdateItineraryUseCase } from '../../application/update-itinerary.usecase';
import type { DeleteItineraryUseCase } from '../../application/delete-itinerary.usecase';
import type {
  createItineraryRoute,
  bulkCreateItinerariesRoute,
  getItineraryRoute,
  listItinerariesRoute,
  updateItineraryRoute,
  deleteItineraryRoute,
} from './hono.itinerary.routes';

export class HonoItineraryController {
  constructor(
    private readonly createItineraryUseCase: CreateItineraryUseCase,
    private readonly bulkCreateItinerariesUseCase: BulkCreateItinerariesUseCase,
    private readonly getItineraryUseCase: GetItineraryUseCase,
    private readonly listItinerariesUseCase: ListItinerariesUseCase,
    private readonly updateItineraryUseCase: UpdateItineraryUseCase,
    private readonly deleteItineraryUseCase: DeleteItineraryUseCase
  ) {}

  list: RouteHandler<typeof listItinerariesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const itineraries = await this.listItinerariesUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(itineraries, 200);
  };

  get: RouteHandler<typeof getItineraryRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const itinerary = await this.getItineraryUseCase.execute(
      organizationId,
      id,
      c.get('userId')
    );
    return c.json(itinerary, 200);
  };

  create: RouteHandler<typeof createItineraryRoute, AppEnv> = async (c) => {
    const { organizationId, degreeId } = c.req.valid('param');
    const body = c.req.valid('json');
    const newItinerary = await this.createItineraryUseCase.execute(
      organizationId,
      degreeId,
      c.get('userId'),
      body
    );
    return c.json(newItinerary, 201);
  };

  bulkCreate: RouteHandler<typeof bulkCreateItinerariesRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId, degreeId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const newItineraries = await this.bulkCreateItinerariesUseCase.execute(
      organizationId,
      degreeId,
      c.get('userId'),
      bodyArray
    );
    return c.json(newItineraries, 201);
  };

  update: RouteHandler<typeof updateItineraryRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const body = c.req.valid('json');
    const updatedItinerary = await this.updateItineraryUseCase.execute(
      organizationId,
      id,
      c.get('userId'),
      body
    );
    return c.json(updatedItinerary, 200);
  };

  delete: RouteHandler<typeof deleteItineraryRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    await this.deleteItineraryUseCase.execute(
      organizationId,
      id,
      c.get('userId')
    );
    return c.body(null, 204);
  };
}
