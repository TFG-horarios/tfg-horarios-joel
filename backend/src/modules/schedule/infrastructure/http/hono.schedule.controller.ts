import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type {
  listSchedulesRoute,
  getScheduleRoute,
  publishScheduleRoute,
  listScheduleSlotsRoute,
  updateScheduleSlotRoute,
  generateScheduleRoute,
} from './hono.schedule.routes';
import type { ListSchedulesUseCase } from '../../application/list-schedules.usecase';
import type { GetScheduleUseCase } from '../../application/get-schedule.usecase';
import type { PublishScheduleUseCase } from '../../application/publish-schedule.usecase';
import type { GenerateScheduleUseCase } from '../../application/generate-schedule.usecase';
import type { ListScheduleSlotsUseCase } from '@/modules/schedule-slot/application/list-schedule-slots.usecase';
import type { UpdateScheduleSlotUseCase } from '@/modules/schedule-slot/application/update-schedule-slot.usecase';

export class HonoScheduleController {
  constructor(
    private readonly listSchedulesUseCase: ListSchedulesUseCase,
    private readonly getScheduleUseCase: GetScheduleUseCase,
    private readonly publishScheduleUseCase: PublishScheduleUseCase,
    private readonly generateScheduleUseCase: GenerateScheduleUseCase,
    private readonly listScheduleSlotsUseCase: ListScheduleSlotsUseCase,
    private readonly updateScheduleSlotUseCase: UpdateScheduleSlotUseCase
  ) {}

  list: RouteHandler<typeof listSchedulesRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const requesterUserId = c.get('userId');
    const schedules = await this.listSchedulesUseCase.execute(
      organizationId,
      requesterUserId,
      query
    );
    return c.json(schedules, 200);
  };

  get: RouteHandler<typeof getScheduleRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const schedule = await this.getScheduleUseCase.execute(
      organizationId,
      requesterUserId,
      id
    );
    return c.json(schedule, 200);
  };

  publish: RouteHandler<typeof publishScheduleRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const publishedSchedule = await this.publishScheduleUseCase.execute(
      organizationId,
      requesterUserId,
      id
    );
    return c.json(publishedSchedule, 200);
  };

  listSlots: RouteHandler<typeof listScheduleSlotsRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const slots = await this.listScheduleSlotsUseCase.execute(
      organizationId,
      requesterUserId,
      id
    );
    return c.json(slots, 200);
  };

  updateSlot: RouteHandler<typeof updateScheduleSlotRoute, AppEnv> = async (
    c
  ) => {
    const { id, organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const updatedSlot = await this.updateScheduleSlotUseCase.execute(
      organizationId,
      requesterUserId,
      id,
      body
    );
    return c.json(updatedSlot, 200);
  };

  generate: RouteHandler<typeof generateScheduleRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const generatedSchedules = await this.generateScheduleUseCase.execute(
      organizationId,
      requesterUserId,
      body
    );
    return c.json(generatedSchedules, 201);
  };
}
