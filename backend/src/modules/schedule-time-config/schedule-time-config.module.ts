import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { MemberAdapter } from '@/modules/academic-year/infrastructure/adapters/member.adapter';
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

export const createScheduleTimeConfigModule = (
  db: DbConnection,
  memberRepository: IMemberRepository,
  createNotificationUseCase?: CreateNotificationUseCase
) => {
  const useCases = new ManageScheduleTimeConfigUseCases(
    new DrizzleScheduleTimeConfigRepository(db),
    new DrizzleAcademicYearRepository(db),
    new MemberAdapter(memberRepository),
    new AcademicYearTimingChangeAdapter(),
    (work) => db.transaction(work),
    createNotificationUseCase
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
