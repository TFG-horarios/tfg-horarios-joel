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
import { GetScheduleUseCase } from './application/get-schedule.usecase';
import { PublishScheduleUseCase } from './application/publish-schedule.usecase';
import { UnpublishScheduleUseCase } from './application/unpublish-schedule.usecase';
import { DeleteScheduleUseCase } from './application/delete-schedule.usecase';
import { GenerateScheduleUseCase } from './application/generate-schedule.usecase';
import { CheckScheduleOverwriteUseCase } from './application/check-schedule-overwrite.usecase';
import { CheckImportSchedulesOverwriteUseCase } from './application/check-import-schedules-overwrite.usecase';
import { ImportSchedulesUseCase } from './application/import-schedules.usecase';
import { ListScheduleSlotsUseCase } from '@/modules/schedule-slot/application/list-schedule-slots.usecase';
import { UpdateScheduleSlotUseCase } from '@/modules/schedule-slot/application/update-schedule-slot.usecase';
import { SchedulerEngineAdapter } from './infrastructure/adapters/scheduler-engine.adapter';
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
  checkImportSchedulesOverwriteRoute,
  importSchedulesRoute,
  deleteScheduleRoute,
  unpublishScheduleRoute,
  streamScheduleEventsRoute,
} from './infrastructure/http/hono.schedule.routes';
import { ScheduleSlotValidationAdapter } from '@/modules/schedule-slot/infrastructure/adapters/schedule-slot-validation.adapter';
import { ScheduleSlotDataAdapter } from '@/modules/schedule-slot/infrastructure/adapters/schedule-slot-data.adapter';
import { ScheduleSlotAdapter } from './infrastructure/adapters/schedule-slot.adapter';
import { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { DrizzleNotificationRepository } from '@/modules/notification/infrastructure/db/drizzle.notification.repository';
import type { IScheduleSlotUnitOfWork } from '@/modules/schedule-slot/domain/schedule-slot-unit-of-work';
import { DrizzleScheduleTimeConfigRepository } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.repository';
import { ScheduleIssueAdapter } from './infrastructure/adapters/schedule-issue.adapter';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { ScheduleImportAdapter } from './infrastructure/adapters/schedule-import.adapter';

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
  const scheduleTimeConfigRepository = new DrizzleScheduleTimeConfigRepository(
    db
  );

  const memberProvider = new MemberRoleAdapter(memberRepository);
  const slotMemberProvider = new MemberRoleAdapter(memberRepository);
  const dataProvider = new ScheduleDataAdapter(
    degreeRepository,
    classroomRepository,
    subjectGroupRepository,
    academicYearRepository,
    reservationRepository,
    createNotificationUseCase,
    scheduleTimeConfigRepository
  );

  const engineProvider = new SchedulerEngineAdapter();
  const issueProvider = new ScheduleIssueAdapter();
  const importProvider = new ScheduleImportAdapter(db);

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

  const slotUnitOfWork: IScheduleSlotUnitOfWork = {
    run: (work) =>
      db.transaction(async (transaction) => {
        const tx = transaction as unknown as DbConnection;
        const txScheduleRepository = new DrizzleScheduleRepository(tx);
        const txSlotRepository = new DrizzleScheduleSlotRepository(tx);
        const txDataProvider = new ScheduleDataAdapter(
          new DrizzleDegreeRepository(tx),
          new DrizzleClassroomRepository(tx),
          new DrizzleSubjectGroupRepository(tx),
          new DrizzleAcademicYearRepository(tx),
          new DrizzleClassroomReservationRepository(tx),
          new CreateNotificationUseCase(new DrizzleNotificationRepository(tx)),
          new DrizzleScheduleTimeConfigRepository(tx)
        );
        const txSlotDataProvider = new ScheduleSlotDataAdapter(
          txScheduleRepository,
          txDataProvider,
          new DrizzleClassroomReservationRepository(tx),
          new CreateNotificationUseCase(new DrizzleNotificationRepository(tx))
        );
        const txValidationProvider = new ScheduleSlotValidationAdapter(
          txSlotRepository,
          txScheduleRepository,
          txDataProvider
        );

        return work({
          repository: txSlotRepository,
          dataProvider: txSlotDataProvider,
          validationProvider: txValidationProvider,
        });
      }),
  };

  const controller = new HonoScheduleController(
    new ListSchedulesUseCase(scheduleRepository, memberProvider),
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
      engineProvider,
      issueProvider
    ),
    new CheckScheduleOverwriteUseCase(
      scheduleRepository,
      dataProvider,
      memberProvider
    ),
    new CheckImportSchedulesOverwriteUseCase(importProvider, memberProvider),
    new ImportSchedulesUseCase(importProvider, memberProvider),
    new ListScheduleSlotsUseCase(scheduleSlotRepository, slotMemberProvider),
    new UpdateScheduleSlotUseCase(
      scheduleSlotRepository,
      slotDataProvider,
      slotMemberProvider,
      slotValidationProvider,
      slotUnitOfWork
    )
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listSchedulesRoute, controller.list)
    .openapi(getScheduleRoute, controller.get)
    .openapi(publishScheduleRoute, controller.publish)
    .openapi(unpublishScheduleRoute, controller.unpublish)
    .openapi(deleteScheduleRoute, controller.delete)
    .openapi(generateScheduleRoute, controller.generate)
    .openapi(checkOverwriteScheduleRoute, controller.checkOverwrite)
    .openapi(
      checkImportSchedulesOverwriteRoute,
      controller.checkImportOverwrite
    )
    .openapi(importSchedulesRoute, controller.importSchedules)
    .openapi(listScheduleSlotsRoute, controller.listSlots)
    .openapi(updateScheduleSlotRoute, controller.updateSlot)
    .openapi(streamScheduleEventsRoute, controller.streamEvents);

  return routes;
};
