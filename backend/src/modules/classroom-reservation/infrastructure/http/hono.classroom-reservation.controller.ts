import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { RequestClassroomReservationUseCase } from '../../application/request-classroom-reservation.usecase';
import type { UpdateClassroomReservationStatusUseCase } from '../../application/update-classroom-reservation-status.usecase';
import type { ListClassroomReservationsUseCase } from '../../application/list-classroom-reservations.usecase';
import type { GetClassroomAvailabilityUseCase } from '../../application/get-classroom-availability.usecase';
import { streamSSE } from 'hono/streaming';
import { SseService } from '@/core/services/sse.service';
import {
  createReservationRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
  getAvailabilityRoute,
  streamClassroomReservationEventsRoute,
} from './hono.classroom-reservation.routes';

export class HonoClassroomReservationController {
  constructor(
    private readonly requestReservationUseCase: RequestClassroomReservationUseCase,
    private readonly updateReservationStatusUseCase: UpdateClassroomReservationStatusUseCase,
    private readonly listReservationsUseCase: ListClassroomReservationsUseCase,
    private readonly getAvailabilityUseCase: GetClassroomAvailabilityUseCase
  ) {}

  create: RouteHandler<typeof createReservationRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const dto = c.req.valid('json');
    const user = c.get('userId');

    const result = await this.requestReservationUseCase.execute(
      organizationId,
      user,
      dto
    );

    SseService.getInstance().broadcast(
      `classroom_${result.classroomId}`,
      'reservation_updated',
      result
    );

    return c.json(result, 201);
  };

  list: RouteHandler<typeof listReservationsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const user = c.get('userId');

    const result = await this.listReservationsUseCase.execute(
      organizationId,
      user,
      query
    );

    return c.json(result, 200);
  };

  updateStatus: RouteHandler<typeof updateReservationStatusRoute, AppEnv> =
    async (c) => {
      const { organizationId, id } = c.req.valid('param');
      const { status } = c.req.valid('json');
      const user = c.get('userId');

      const result = await this.updateReservationStatusUseCase.execute(
        organizationId,
        user,
        id,
        { status }
      );

      SseService.getInstance().broadcast(
        `classroom_${result.classroomId}`,
        'reservation_updated',
        result
      );

      return c.json(result, 200);
    };

  getAvailability: RouteHandler<typeof getAvailabilityRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');

    const result = await this.getAvailabilityUseCase.execute(
      organizationId,
      query
    );

    return c.json(result, 200);
  };

  streamEvents: RouteHandler<
    typeof streamClassroomReservationEventsRoute,
    AppEnv
  > = async (c) => {
    const { classroomId } = c.req.valid('param');
    const topic = `classroom_${classroomId}`;

    return streamSSE(c, async (stream) => {
      const sseService = SseService.getInstance();
      sseService.addClient(topic, stream);

      stream.onAbort(() => {
        sseService.removeClient(topic, stream);
      });

      while (true) {
        await stream.sleep(30000);
      }
    });
  };
}
