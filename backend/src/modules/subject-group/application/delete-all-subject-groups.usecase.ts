import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectGroupScheduleProvider } from '../domain/providers/subject-group-schedule.provider';

export class DeleteAllSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: ISubjectGroupScheduleProvider,
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
        'You do not have permission to delete subject groups in this organization.'
      );
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.reevaluateSchedules ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.deleteAll(organizationId);
      return;
    }
    const groups = await this.subjectGroupRepository.findAll(
      organizationId,
      false
    );
    const yearIds =
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectGroupRepository.deleteAll(organizationId, tx);
      const scheduleIds =
        await this.scheduleProvider!.handleSubjectGroupsDeletion(
          groups.map((group) => group.id),
          organizationId,
          yearIds,
          tx
        );
      await this.reevaluateSchedules!.execute(scheduleIds, organizationId, tx);
    });
  }
}
