import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { ManageScheduleTimeConfigUseCases } from './application/manage-schedule-time-config.usecases';
import { DrizzleScheduleTimeConfigRepository } from './infrastructure/db/drizzle.schedule-time-config.repository';
import { HonoScheduleTimeConfigController } from './infrastructure/http/hono.schedule-time-config.controller';
import {
  createTimeConfigRoute,
  deleteTimeConfigRoute,
  listTimeConfigsRoute,
  updateTimeConfigRoute,
  getPossibilitiesRoute,
} from './infrastructure/http/hono.schedule-time-config.routes';
import { AcademicYearTimingChangeAdapter } from '@/modules/academic-year/infrastructure/adapters/timing-change.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { ScheduleTimeConfigAcademicYearAdapter } from './infrastructure/adapters/schedule-time-config-academic-year.adapter';
import { ScheduleTimeConfigTimingChangeAdapter } from './infrastructure/adapters/schedule-time-config-timing-change.adapter';
import { ScheduleTimeConfigTimingChangeNotifierAdapter } from './infrastructure/adapters/schedule-time-config-timing-change-notifier.adapter';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';

export const createScheduleTimeConfigModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  createNotificationUseCase?: CreateNotificationUseCase
) => {
  const useCases = new ManageScheduleTimeConfigUseCases(
    new DrizzleScheduleTimeConfigRepository(db),
    new ScheduleTimeConfigAcademicYearAdapter(
      new DrizzleAcademicYearRepository(db)
    ),
    new MemberRoleAdapter(memberRepository),
    new ScheduleTimeConfigTimingChangeAdapter(
      new AcademicYearTimingChangeAdapter()
    ),
    (work) => db.transaction(work),
    new ScheduleTimeConfigTimingChangeNotifierAdapter(createNotificationUseCase)
  );
  const controller = new HonoScheduleTimeConfigController(useCases);
  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(getPossibilitiesRoute, controller.getPossibilities)
    .openapi(listTimeConfigsRoute, controller.list)
    .openapi(createTimeConfigRoute, controller.create)
    .openapi(updateTimeConfigRoute, controller.update)
    .openapi(deleteTimeConfigRoute, controller.delete);
  return routes;
};
