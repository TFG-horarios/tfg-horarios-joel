import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';

export class DeleteAllClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: IScheduleProvider,
    private readonly reevaluateSchedules?: ReevaluateSchedulesUseCase,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete classrooms in this organization.'
      );
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.reevaluateSchedules ||
      !this.runInTransaction
    ) {
      await this.classroomRepository.deleteAll(organizationId);
      return;
    }

    const classrooms = await this.classroomRepository.findAll(
      organizationId,
      false
    );
    const classroomIds = classrooms.map((classroom) => classroom.id);
    const yearIds =
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.classroomRepository.deleteAll(organizationId, tx);
      const scheduleIds = await this.scheduleProvider!.handleClassroomsDeletion(
        classroomIds,
        organizationId,
        yearIds,
        tx
      );
      await this.reevaluateSchedules!.execute(scheduleIds, organizationId, tx);
    });
  }
}
