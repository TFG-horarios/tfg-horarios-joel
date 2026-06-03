import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleScheduleRepository } from './infrastructure/db/drizzle.schedule.repository';
import { DrizzleScheduleSlotRepository } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { DrizzleDegreeRepository } from '@/modules/degree/infrastructure/db/drizzle.degree.repository';
import { DrizzleClassroomRepository } from '@/modules/classroom/infrastructure/db/drizzle.classroom.repository';
import { DrizzleSubjectGroupRepository } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.repository';
import { DrizzleOrganizationRepository } from '@/modules/organization/infrastructure/db/drizzle.organization.repository';
import { ListSchedulesUseCase } from './application/list-schedules.usecase';
import { ListAllSchedulesUseCase } from './application/list-all-schedules.usecase';
import { GetScheduleUseCase } from './application/get-schedule.usecase';
import { PublishScheduleUseCase } from './application/publish-schedule.usecase';
import { GenerateScheduleUseCase } from './application/generate-schedule.usecase';
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
  listAllSchedulesRoute,
} from './infrastructure/http/hono.schedule.routes';

export const createScheduleModule = (db: DbConnection) => {
  const scheduleRepository = new DrizzleScheduleRepository(db);
  const scheduleSlotRepository = new DrizzleScheduleSlotRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);
  const degreeRepository = new DrizzleDegreeRepository(db);
  const classroomRepository = new DrizzleClassroomRepository(db);
  const subjectGroupRepository = new DrizzleSubjectGroupRepository(db);
  const organizationRepository = new DrizzleOrganizationRepository(db);

  const memberProvider = new ScheduleMemberAdapter(memberRepository);
  const slotMemberProvider = new ScheduleSlotMemberAdapter(memberRepository);
  const dataProvider = new ScheduleDataAdapter(
    degreeRepository,
    classroomRepository,
    subjectGroupRepository,
    organizationRepository
  );

  const engineProvider = new SchedulerEngineAdapter();

  const controller = new HonoScheduleController(
    new ListSchedulesUseCase(scheduleRepository, memberProvider),
    new ListAllSchedulesUseCase(scheduleRepository, memberProvider),
    new GetScheduleUseCase(scheduleRepository, memberProvider),
    new PublishScheduleUseCase(scheduleRepository, memberProvider),
    new GenerateScheduleUseCase(
      scheduleRepository,
      dataProvider,
      memberProvider,
      engineProvider
    ),
    new ListScheduleSlotsUseCase(scheduleSlotRepository, slotMemberProvider),
    new UpdateScheduleSlotUseCase(scheduleSlotRepository, slotMemberProvider)
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listAllSchedulesRoute, controller.listAll)
    .openapi(listSchedulesRoute, controller.list)
    .openapi(getScheduleRoute, controller.get)
    .openapi(publishScheduleRoute, controller.publish)
    .openapi(generateScheduleRoute, controller.generate)
    .openapi(listScheduleSlotsRoute, controller.listSlots)
    .openapi(updateScheduleSlotRoute, controller.updateSlot);

  return routes;
};
