import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleClassroomRepository } from './infrastructure/db/drizzle.classroom.repository';
import { CreateClassroomUseCase } from './application/create-classroom.usecase';
import { HonoClassroomController } from './infrastructure/http/hono.classroom.controller';
import {
  createClassroomRoute,
  listClassroomsRoute,
  deleteClassroomRoute,
  updateClassroomRoute,
  getClassroomRoute,
  createManyClassroomsRoute,
  deleteAllClassroomsRoute,
  replaceClassroomsRoute,
  getClassroomIdentifiersRoute,
  listAllClassroomsRoute,
  getActiveClassroomConfigurationsRoute,
  getClassroomScheduleSlotsRoute,
  getClassroomOccupancyRoute,
} from './infrastructure/http/hono.classroom.routes';
import { DeleteClassroomUseCase } from './application/delete-classroom.usecase';
import { UpdateClassroomUseCase } from './application/update-classroom.usecase';
import { ListClassroomsUseCase } from './application/list-classroom.usecase';
import { ListAllClassroomsUseCase } from './application/list-all-classrooms.usecase';
import { GetClassroomIdentifiersUseCase } from './application/get-classroom-identifiers.usecase';
import { GetClassroomUseCase } from './application/get-classroom.usecase';
import { BulkCreateClassroomsUseCase } from './application/bulk-create-classroom.usecase';
import { DeleteAllClassroomsUseCase } from './application/delete-all-classrooms.usecase';
import { ReplaceClassroomsUseCase } from './application/replace-classrooms.usecase';
import { GetActiveClassroomConfigurationsUseCase } from './application/get-active-classroom-configurations.usecase';
import { GetClassroomScheduleSlotsUseCase } from './application/get-classroom-schedule-slots.usecase';
import { GetClassroomOccupancyUseCase } from './application/get-classroom-occupancy.usecase';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { MemberRoleAdapter } from '@/modules/member/infrastructure/adapters/member-role.adapter';
import { DrizzleScheduleSlotRepository } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.repository';
import { ScheduleSlotAdapter } from './infrastructure/adapters/schedule-slot.adapter';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleAcademicYearRepository } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.repository';
import { DrizzleClassroomReservationRepository } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.repository';
import { ScheduleAdapter } from './infrastructure/adapters/schedule.adapter';
import { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';
import { DrizzleScheduleTimeConfigRepository } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.repository';
import { ScheduleIssueAdapter } from '@/modules/schedule/infrastructure/adapters/schedule-issue.adapter';
import { ClassroomOccupancyAdapter } from './infrastructure/adapters/classroom-occupancy.adapter';

export const createClassroomModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const classroomRepository = new DrizzleClassroomRepository(db);
  const scheduleSlotRepository = new DrizzleScheduleSlotRepository(db);
  const scheduleSlotProvider = new ScheduleSlotAdapter(scheduleSlotRepository);
  const scheduleRepository = new DrizzleScheduleRepository(db);
  const academicYearRepository = new DrizzleAcademicYearRepository(db);
  const scheduleTimeConfigRepository = new DrizzleScheduleTimeConfigRepository(
    db
  );

  const memberProvider = new MemberRoleAdapter(memberRepository);
  const reevaluateSchedules = new ReevaluateSchedulesUseCase(
    scheduleRepository,
    new ScheduleIssueAdapter()
  );
  const scheduleProvider = new ScheduleAdapter(
    scheduleRepository,
    new DrizzleClassroomReservationRepository(db),
    reevaluateSchedules
  );
  const academicYearProvider = new AcademicYearAdapter(academicYearRepository);
  const occupancyProvider = new ClassroomOccupancyAdapter(
    scheduleRepository,
    scheduleSlotRepository,
    scheduleTimeConfigRepository,
    academicYearRepository
  );
  const runInTransaction: TransactionRunner = (work) => db.transaction(work);

  const createUseCase = new CreateClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const listUseCase = new ListClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const listAllUseCase = new ListAllClassroomsUseCase(
    classroomRepository,
    memberProvider,
    academicYearProvider
  );

  const getIdentifiersUseCase = new GetClassroomIdentifiersUseCase(
    classroomRepository,
    memberProvider
  );

  const updateUseCase = new UpdateClassroomUseCase(
    classroomRepository,
    memberProvider
  );

  const deleteUseCase = new DeleteClassroomUseCase(
    classroomRepository,
    memberProvider,
    academicYearProvider,
    scheduleProvider,
    runInTransaction
  );

  const getUseCase = new GetClassroomUseCase(
    classroomRepository,
    memberProvider,
    academicYearProvider
  );

  const createManyUseCase = new BulkCreateClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const deleteAllUseCase = new DeleteAllClassroomsUseCase(
    classroomRepository,
    memberProvider,
    academicYearProvider,
    scheduleProvider,
    runInTransaction
  );

  const replaceUseCase = new ReplaceClassroomsUseCase(
    classroomRepository,
    memberProvider
  );

  const getActiveConfigurationsUseCase =
    new GetActiveClassroomConfigurationsUseCase(
      scheduleSlotProvider,
      memberProvider
    );

  const getScheduleSlotsUseCase = new GetClassroomScheduleSlotsUseCase(
    scheduleSlotProvider,
    classroomRepository,
    memberProvider,
    academicYearProvider
  );

  const getClassroomOccupancyUseCase = new GetClassroomOccupancyUseCase(
    occupancyProvider,
    classroomRepository,
    memberProvider,
    academicYearProvider
  );

  const controller = new HonoClassroomController(
    createUseCase,
    listUseCase,
    updateUseCase,
    deleteUseCase,
    getUseCase,
    createManyUseCase,
    deleteAllUseCase,
    replaceUseCase,
    getIdentifiersUseCase,
    listAllUseCase,
    getActiveConfigurationsUseCase,
    getScheduleSlotsUseCase,
    getClassroomOccupancyUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createClassroomRoute, controller.create)
    .openapi(createManyClassroomsRoute, controller.createMany)
    .openapi(replaceClassroomsRoute, controller.replace)
    .openapi(listClassroomsRoute, controller.list)
    .openapi(listAllClassroomsRoute, controller.listAll)
    .openapi(
      getActiveClassroomConfigurationsRoute,
      controller.getActiveConfigurations
    )
    .openapi(getClassroomIdentifiersRoute, controller.getIdentifiers)
    .openapi(getClassroomRoute, controller.get)
    .openapi(getClassroomScheduleSlotsRoute, controller.getScheduleSlots)
    .openapi(getClassroomOccupancyRoute, controller.getOccupancy)
    .openapi(updateClassroomRoute, controller.update)
    .openapi(deleteClassroomRoute, controller.delete)
    .openapi(deleteAllClassroomsRoute, controller.deleteAll);

  return routes;
};
