import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import { DrizzleClassroomReservationRepository } from './infrastructure/db/drizzle.classroom-reservation.repository';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { ClassroomReservationScheduleAdapter } from './infrastructure/adapters/classroom-reservation-schedule.adapter';
import { RequestClassroomReservationUseCase } from './application/request-classroom-reservation.usecase';
import { UpdateClassroomReservationStatusUseCase } from './application/update-classroom-reservation-status.usecase';
import { ListClassroomReservationsUseCase } from './application/list-classroom-reservations.usecase';
import { GetClassroomAvailabilityUseCase } from './application/get-classroom-availability.usecase';
import { CancelClassroomReservationUseCase } from './application/cancel-classroom-reservation.usecase';
import { HonoClassroomReservationController } from './infrastructure/http/hono.classroom-reservation.controller';
import {
  createReservationRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
  getAvailabilityRoute,
  streamClassroomReservationEventsRoute,
  cancelReservationRoute,
} from './infrastructure/http/hono.classroom-reservation.routes';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import { ClassroomReservationAcademicYearAdapter } from './infrastructure/adapters/classroom-reservation-academic-year.adapter';
import { ClassroomReservationNotificationAdapter } from './infrastructure/adapters/classroom-reservation-notification.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { DrizzleScheduleTimeConfigRepository } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.repository';

export const createClassroomReservationModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  scheduleRepository: IScheduleRepository,
  scheduleSlotRepository: IScheduleSlotRepository,
  academicYearRepository: IAcademicYearRepository,
  createNotificationUseCase: CreateNotificationUseCase
) => {
  const reservationRepository = new DrizzleClassroomReservationRepository(db);
  const scheduleTimeConfigRepository = new DrizzleScheduleTimeConfigRepository(
    db
  );
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const scheduleProvider = new ClassroomReservationScheduleAdapter(
    scheduleRepository,
    scheduleSlotRepository,
    academicYearRepository,
    scheduleTimeConfigRepository
  );

  const academicYearProvider = new ClassroomReservationAcademicYearAdapter(
    academicYearRepository
  );

  const notificationProvider = new ClassroomReservationNotificationAdapter(
    createNotificationUseCase
  );

  const requestUseCase = new RequestClassroomReservationUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearProvider,
    notificationProvider
  );

  const updateStatusUseCase = new UpdateClassroomReservationStatusUseCase(
    reservationRepository,
    scheduleProvider,
    memberProvider,
    academicYearProvider,
    notificationProvider
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

  const cancelUseCase = new CancelClassroomReservationUseCase(
    reservationRepository,
    memberProvider
  );

  const controller = new HonoClassroomReservationController(
    requestUseCase,
    updateStatusUseCase,
    listUseCase,
    getAvailabilityUseCase,
    cancelUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createReservationRoute, controller.create)
    .openapi(listReservationsRoute, controller.list)
    .openapi(updateReservationStatusRoute, controller.updateStatus)
    .openapi(getAvailabilityRoute, controller.getAvailability)
    .openapi(streamClassroomReservationEventsRoute, controller.streamEvents)
    .openapi(cancelReservationRoute, controller.cancel);

  return routes;
};
