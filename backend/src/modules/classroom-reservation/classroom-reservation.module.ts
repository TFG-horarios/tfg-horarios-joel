import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import { DrizzleClassroomReservationRepository } from './infrastructure/db/drizzle.classroom-reservation.repository';
import { ClassroomReservationMemberAdapter } from './infrastructure/adapters/classroom-reservation-member.adapter';
import { ClassroomReservationScheduleAdapter } from './infrastructure/adapters/classroom-reservation-schedule.adapter';
import { RequestClassroomReservationUseCase } from './application/request-classroom-reservation.usecase';
import { UpdateClassroomReservationStatusUseCase } from './application/update-classroom-reservation-status.usecase';
import { ListClassroomReservationsUseCase } from './application/list-classroom-reservations.usecase';
import { HonoClassroomReservationController } from './infrastructure/http/hono.classroom-reservation.controller';
import {
  createReservationRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
} from './infrastructure/http/hono.classroom-reservation.routes';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export const createClassroomReservationModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  scheduleRepository: IScheduleRepository,
  scheduleSlotRepository: IScheduleSlotRepository,
  academicYearRepository: IAcademicYearRepository
) => {
  const reservationRepository = new DrizzleClassroomReservationRepository(db);
  const memberProvider = new ClassroomReservationMemberAdapter(
    memberRepository
  );
  const scheduleProvider = new ClassroomReservationScheduleAdapter(
    scheduleRepository,
    scheduleSlotRepository
  );

  const requestUseCase = new RequestClassroomReservationUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearRepository
  );

  const updateStatusUseCase = new UpdateClassroomReservationStatusUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearRepository
  );

  const listUseCase = new ListClassroomReservationsUseCase(
    reservationRepository,
    memberProvider
  );

  const controller = new HonoClassroomReservationController(
    requestUseCase,
    updateStatusUseCase,
    listUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createReservationRoute, controller.create)
    .openapi(listReservationsRoute, controller.list)
    .openapi(updateReservationStatusRoute, controller.updateStatus);

  return routes;
};
