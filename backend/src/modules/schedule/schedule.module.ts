import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleScheduleRepository } from './infrastructure/db/drizzle.schedule.repository';
import { DrizzleScheduleSlotRepository } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { DrizzleDegreeRepository } from '@/modules/degree/infrastructure/db/drizzle.degree.repository';
import { DrizzleClassroomRepository } from '@/modules/classroom/infrastructure/db/drizzle.classroom.repository';
import { DrizzleSubjectGroupRepository } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { DrizzleClassroomReservationRepository } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.repository';
import { ListSchedulesUseCase } from './application/list-schedules.usecase';
import { ListAllSchedulesUseCase } from './application/list-all-schedules.usecase';
import { GetScheduleUseCase } from './application/get-schedule.usecase';
import { PublishScheduleUseCase } from './application/publish-schedule.usecase';
import { UnpublishScheduleUseCase } from './application/unpublish-schedule.usecase';
import { DeleteScheduleUseCase } from './application/delete-schedule.usecase';
import { GenerateScheduleUseCase } from './application/generate-schedule.usecase';
import { CheckScheduleOverwriteUseCase } from './application/check-schedule-overwrite.usecase';
import { ListScheduleSlotsUseCase } from '@/modules/schedule-slot/application/list-schedule-slots.usecase';
import { UpdateScheduleSlotUseCase } from '@/modules/schedule-slot/application/update-schedule-slot.usecase';
import { ScheduleSlotMemberAdapter } from '@/modules/schedule-slot/infrastructure/adapters/schedule-slot-member.adapter';
import { SchedulerEngineAdapter } from './infrastructure/adapters/scheduler-engine.adapter';
import { ScheduleMemberAdapter } from './infrastructure/adapters/schedule-member.adapter';
import { ScheduleDataAdapter } from './infrastructure/adapters/schedule-data.adapter';
import { HonoScheduleController } from './infrastructure/http/hono.schedule.controller';
import {
  listSchedulesRoute,
  getScheduleRoute,
  publishScheduleRoute,
  listScheduleSlotsRoute,
  updateScheduleSlotRoute,
  generateScheduleRoute,
  checkOverwriteScheduleRoute,
  listAllSchedulesRoute,
  deleteScheduleRoute,
  unpublishScheduleRoute,
  streamScheduleEventsRoute,
} from './infrastructure/http/hono.schedule.routes';
import { ScheduleSlotValidationAdapter } from '@/modules/schedule-slot/infrastructure/adapters/schedule-slot-validation.adapter';
import { ScheduleSlotDataAdapter } from '@/modules/schedule-slot/infrastructure/adapters/schedule-slot-data.adapter';
import { ScheduleSlotAdapter } from './infrastructure/adapters/schedule-slot.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

export const createScheduleModule = (
  db: DbConnection,
  createNotificationUseCase: CreateNotificationUseCase
) => {
  const scheduleRepository = new DrizzleScheduleRepository(db);
  const scheduleSlotRepository = new DrizzleScheduleSlotRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);
  const degreeRepository = new DrizzleDegreeRepository(db);
  const classroomRepository = new DrizzleClassroomRepository(db);
  const subjectGroupRepository = new DrizzleSubjectGroupRepository(db);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const reservationRepository = new DrizzleClassroomReservationRepository(db);

  const memberProvider = new ScheduleMemberAdapter(memberRepository);
  const slotMemberProvider = new ScheduleSlotMemberAdapter(memberRepository);
  const dataProvider = new ScheduleDataAdapter(
    degreeRepository,
    classroomRepository,
    subjectGroupRepository,
    academicYearRepository,
    reservationRepository
  );

  const engineProvider = new SchedulerEngineAdapter();

  const slotValidationProvider = new ScheduleSlotValidationAdapter(
    scheduleSlotRepository,
    scheduleRepository,
    dataProvider
  );

  const slotDataProvider = new ScheduleSlotDataAdapter(
    scheduleRepository,
    dataProvider,
    reservationRepository,
    createNotificationUseCase
  );

  const slotProvider = new ScheduleSlotAdapter(scheduleSlotRepository);

  const controller = new HonoScheduleController(
    new ListSchedulesUseCase(scheduleRepository, memberProvider),
    new ListAllSchedulesUseCase(scheduleRepository, memberProvider),
    new GetScheduleUseCase(scheduleRepository, memberProvider),
    new PublishScheduleUseCase(
      scheduleRepository,
      slotProvider,
      memberProvider
    ),
    new UnpublishScheduleUseCase(scheduleRepository, memberProvider),
    new DeleteScheduleUseCase(scheduleRepository, memberProvider),
    new GenerateScheduleUseCase(
      scheduleRepository,
      dataProvider,
      memberProvider,
      engineProvider
    ),
    new CheckScheduleOverwriteUseCase(
      scheduleRepository,
      dataProvider,
      memberProvider
    ),
    new ListScheduleSlotsUseCase(scheduleSlotRepository, slotMemberProvider),
    new UpdateScheduleSlotUseCase(
      scheduleSlotRepository,
      slotDataProvider,
      slotMemberProvider,
      slotValidationProvider
    )
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllSchedulesRoute, controller.listAll)
    .openapi(listSchedulesRoute, controller.list)
    .openapi(getScheduleRoute, controller.get)
    .openapi(publishScheduleRoute, controller.publish)
    .openapi(unpublishScheduleRoute, controller.unpublish)
    .openapi(deleteScheduleRoute, controller.delete)
    .openapi(generateScheduleRoute, controller.generate)
    .openapi(checkOverwriteScheduleRoute, controller.checkOverwrite)
    .openapi(listScheduleSlotsRoute, controller.listSlots)
    .openapi(updateScheduleSlotRoute, controller.updateSlot)
    .openapi(streamScheduleEventsRoute, controller.streamEvents);

  return routes;
};
