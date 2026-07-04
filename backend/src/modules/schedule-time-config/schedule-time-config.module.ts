import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { AppEnv } from '@/core/types/app-types';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { CreateScheduleTimeConfigUseCase } from './application/create-schedule-time-config.usecase';
import { DeleteScheduleTimeConfigUseCase } from './application/delete-schedule-time-config.usecase';
import { GetScheduleTimeConfigPossibilitiesUseCase } from './application/get-schedule-time-config-possibilities.usecase';
import { ListScheduleTimeConfigsUseCase } from './application/list-schedule-time-configs.usecase';
import { ScheduleTimeConfigGridValidator } from './application/schedule-time-config-grid.validator';
import { UpdateScheduleTimeConfigUseCase } from './application/update-schedule-time-config.usecase';
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
  const repository = new DrizzleScheduleTimeConfigRepository(db);
  const memberProvider = new MemberRoleAdapter(memberRepository);
  const academicYearProvider = new ScheduleTimeConfigAcademicYearAdapter(
    new DrizzleAcademicYearRepository(db)
  );
  const gridValidator = new ScheduleTimeConfigGridValidator(
    repository,
    academicYearProvider
  );
  const academicYearTimingChangeProvider =
    new AcademicYearTimingChangeAdapter();
  const scheduleTimeConfigTimingChangeProvider =
    new ScheduleTimeConfigTimingChangeAdapter(academicYearTimingChangeProvider);
  const runInTransaction: TransactionRunner = (work) => db.transaction(work);
  const scheduleTimeConfigTimingChangeNotifierProvider =
    new ScheduleTimeConfigTimingChangeNotifierAdapter(
      createNotificationUseCase
    );
  const updateScheduleTimeConfigUseCase = new UpdateScheduleTimeConfigUseCase(
    repository,
    memberProvider,
    gridValidator,
    scheduleTimeConfigTimingChangeProvider,
    runInTransaction,
    scheduleTimeConfigTimingChangeNotifierProvider
  );
  const createScheduleTimeConfigUseCase = new CreateScheduleTimeConfigUseCase(
    repository,
    memberProvider,
    gridValidator
  );
  const deleteScheduleTimeConfigUseCase = new DeleteScheduleTimeConfigUseCase(
    repository,
    memberProvider
  );
  const getScheduleTimeConfigPossibilitiesUseCase =
    new GetScheduleTimeConfigPossibilitiesUseCase(repository, memberProvider);
  const listScheduleTimeConfigsUseCase = new ListScheduleTimeConfigsUseCase(
    repository,
    memberProvider
  );
  const controller = new HonoScheduleTimeConfigController(
    listScheduleTimeConfigsUseCase,
    createScheduleTimeConfigUseCase,
    updateScheduleTimeConfigUseCase,
    deleteScheduleTimeConfigUseCase,
    getScheduleTimeConfigPossibilitiesUseCase
  );
  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(getPossibilitiesRoute, controller.getPossibilities)
    .openapi(listTimeConfigsRoute, controller.list)
    .openapi(createTimeConfigRoute, controller.create)
    .openapi(updateTimeConfigRoute, controller.update)
    .openapi(deleteTimeConfigRoute, controller.delete);
  return routes;
};
