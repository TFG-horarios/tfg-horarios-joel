import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { CreateScheduleTimeConfigUseCase } from '../../application/create-schedule-time-config.usecase';
import type { DeleteScheduleTimeConfigUseCase } from '../../application/delete-schedule-time-config.usecase';
import type { GetScheduleTimeConfigPossibilitiesUseCase } from '../../application/get-schedule-time-config-possibilities.usecase';
import type { ListScheduleTimeConfigsUseCase } from '../../application/list-schedule-time-configs.usecase';
import type { UpdateScheduleTimeConfigUseCase } from '../../application/update-schedule-time-config.usecase';
import {
  createTimeConfigRoute,
  deleteTimeConfigRoute,
  listTimeConfigsRoute,
  updateTimeConfigRoute,
  getPossibilitiesRoute,
} from './hono.schedule-time-config.routes';

export class HonoScheduleTimeConfigController {
  constructor(
    private readonly listScheduleTimeConfigs: ListScheduleTimeConfigsUseCase,
    private readonly createScheduleTimeConfig: CreateScheduleTimeConfigUseCase,
    private readonly updateScheduleTimeConfig: UpdateScheduleTimeConfigUseCase,
    private readonly deleteScheduleTimeConfig: DeleteScheduleTimeConfigUseCase,
    private readonly getScheduleTimeConfigPossibilities: GetScheduleTimeConfigPossibilitiesUseCase
  ) {}

  list: RouteHandler<typeof listTimeConfigsRoute, AppEnv> = async (c) => {
    const { organizationId, academicYearId } = c.req.valid('param');
    return c.json(
      await this.listScheduleTimeConfigs.execute(
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
      await this.createScheduleTimeConfig.execute(
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
      await this.updateScheduleTimeConfig.execute(
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
    await this.deleteScheduleTimeConfig.execute(
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
      await this.getScheduleTimeConfigPossibilities.execute(
        organizationId,
        academicYearId,
        c.get('userId')
      ),
      200
    );
  };
}
