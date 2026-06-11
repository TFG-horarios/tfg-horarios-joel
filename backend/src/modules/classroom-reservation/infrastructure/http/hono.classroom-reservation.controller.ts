import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { RequestClassroomReservationUseCase } from '../../application/request-classroom-reservation.usecase';
import type { UpdateClassroomReservationStatusUseCase } from '../../application/update-classroom-reservation-status.usecase';
import type { ListClassroomReservationsUseCase } from '../../application/list-classroom-reservations.usecase';
import {
  createReservationRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
} from './hono.classroom-reservation.routes';

export class HonoClassroomReservationController {
  constructor(
    private readonly requestReservationUseCase: RequestClassroomReservationUseCase,
    private readonly updateReservationStatusUseCase: UpdateClassroomReservationStatusUseCase,
    private readonly listReservationsUseCase: ListClassroomReservationsUseCase
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

      return c.json(result, 200);
    };
}
