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
  deleteAllItinerariesRoute,
  replaceItinerariesRoute,
  getItineraryIdentifiersRoute,
  listAllItinerariesRoute,
} from './hono.itinerary.routes';
import type { DeleteAllItinerariesUseCase } from '../../application/delete-all-itineraries.usecase';
import type { ReplaceItinerariesUseCase } from '../../application/replace-itineraries.usecase';
import type { GetItineraryIdentifiersUseCase } from '../../application/get-itinerary-identifiers.usecase';
import type { ListAllItinerariesUseCase } from '../../application/list-all-itineraries.usecase';

export class HonoItineraryController {
  constructor(
    private readonly createItineraryUseCase: CreateItineraryUseCase,
    private readonly bulkCreateItinerariesUseCase: BulkCreateItinerariesUseCase,
    private readonly getItineraryUseCase: GetItineraryUseCase,
    private readonly listItinerariesUseCase: ListItinerariesUseCase,
    private readonly updateItineraryUseCase: UpdateItineraryUseCase,
    private readonly deleteItineraryUseCase: DeleteItineraryUseCase,
    private readonly deleteAllItinerariesUseCase: DeleteAllItinerariesUseCase,
    private readonly replaceItinerariesUseCase: ReplaceItinerariesUseCase,
    private readonly getItineraryIdentifiersUseCase: GetItineraryIdentifiersUseCase,
    private readonly listAllItinerariesUseCase: ListAllItinerariesUseCase
  ) {}

  list: RouteHandler<typeof listItinerariesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const itineraries = await this.listItinerariesUseCase.execute(
      organizationId,
      c.get('userId'),
      query
    );
    return c.json(itineraries, 200);
  };

  listAll: RouteHandler<typeof listAllItinerariesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const itineraries = await this.listAllItinerariesUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(itineraries, 200);
  };

  getIdentifiers: RouteHandler<typeof getItineraryIdentifiersRoute, AppEnv> =
    async (c) => {
      const { organizationId } = c.req.valid('param');
      const identifiers = await this.getItineraryIdentifiersUseCase.execute(
        organizationId,
        c.get('userId')
      );
      return c.json(identifiers, 200);
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
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const newItineraries = await this.bulkCreateItinerariesUseCase.execute(
      organizationId,
      c.get('userId'),
      bodyArray
    );
    return c.json(newItineraries, 201);
  };

  replace: RouteHandler<typeof replaceItinerariesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const bodyArray = c.req.valid('json');
    const replacedItineraries = await this.replaceItinerariesUseCase.execute(
      organizationId,
      c.get('userId'),
      bodyArray
    );
    return c.json(replacedItineraries, 200);
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

  deleteAll: RouteHandler<typeof deleteAllItinerariesRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    await this.deleteAllItinerariesUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.body(null, 204);
  };
}
