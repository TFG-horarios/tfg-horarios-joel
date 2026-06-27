import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { ManageScheduleTimeConfigUseCases } from '../../application/manage-schedule-time-config.usecases';
import {
  createTimeConfigRoute,
  deleteTimeConfigRoute,
  listTimeConfigsRoute,
  updateTimeConfigRoute,
  getPossibilitiesRoute,
} from './hono.schedule-time-config.routes';

export class HonoScheduleTimeConfigController {
  constructor(private readonly useCases: ManageScheduleTimeConfigUseCases) {}

  list: RouteHandler<typeof listTimeConfigsRoute, AppEnv> = async (c) => {
    const { organizationId, academicYearId } = c.req.valid('param');
    return c.json(
      await this.useCases.list(
        organizationId,
        academicYearId,
        c.get('userId'),
        c.req.valid('query')
      ),
      200
    );
  };

  create: RouteHandler<typeof createTimeConfigRoute, AppEnv> = async (c) => {
    const { organizationId, academicYearId } = c.req.valid('param');
    return c.json(
      await this.useCases.create(
        organizationId,
        academicYearId,
        c.get('userId'),
        c.req.valid('json')
      ),
      201
    );
  };

  update: RouteHandler<typeof updateTimeConfigRoute, AppEnv> = async (c) => {
    const { organizationId, academicYearId, id } = c.req.valid('param');
    return c.json(
      await this.useCases.update(
        organizationId,
        academicYearId,
        id,
        c.get('userId'),
        c.req.valid('json')
      ),
      200
    );
  };

  delete: RouteHandler<typeof deleteTimeConfigRoute, AppEnv> = async (c) => {
    const { organizationId, academicYearId, id } = c.req.valid('param');
    await this.useCases.delete(
      organizationId,
      academicYearId,
      id,
      c.get('userId')
    );
    return c.body(null, 204);
  };

  getPossibilities: RouteHandler<typeof getPossibilitiesRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId, academicYearId } = c.req.valid('param');
    return c.json(
      await this.useCases.getPossibilities(
        organizationId,
        academicYearId,
        c.get('userId')
      ),
      200
    );
  };
}
