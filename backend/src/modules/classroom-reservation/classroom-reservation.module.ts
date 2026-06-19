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
import { GetClassroomAvailabilityUseCase } from './application/get-classroom-availability.usecase';
import { HonoClassroomReservationController } from './infrastructure/http/hono.classroom-reservation.controller';
import {
  createReservationRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
  getAvailabilityRoute,
  streamClassroomReservationEventsRoute,
} from './infrastructure/http/hono.classroom-reservation.routes';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import { ClassroomReservationAcademicYearAdapter } from './infrastructure/adapters/classroom-reservation-academic-year.adapter';

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

  const academicYearProvider = new ClassroomReservationAcademicYearAdapter(
    academicYearRepository
  );

  const requestUseCase = new RequestClassroomReservationUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearProvider
  );

  const updateStatusUseCase = new UpdateClassroomReservationStatusUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearProvider
  );

  const listUseCase = new ListClassroomReservationsUseCase(
    reservationRepository,
    memberProvider
  );

  const getAvailabilityUseCase = new GetClassroomAvailabilityUseCase(
    reservationRepository,
    scheduleProvider,
    academicYearProvider
  );

  const controller = new HonoClassroomReservationController(
    requestUseCase,
    updateStatusUseCase,
    listUseCase,
    getAvailabilityUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createReservationRoute, controller.create)
    .openapi(listReservationsRoute, controller.list)
    .openapi(updateReservationStatusRoute, controller.updateStatus)
    .openapi(getAvailabilityRoute, controller.getAvailability)
    .openapi(streamClassroomReservationEventsRoute, controller.streamEvents);

  return routes;
};
