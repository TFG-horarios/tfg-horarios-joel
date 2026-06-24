import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectGroupScheduleProvider } from '../domain/providers/subject-group-schedule.provider';

export class DeleteSubjectGroupUseCase {
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
    id: string,
    requesterUserId: string
  ): Promise<void> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete groups in this organization.'
      );
    }

    const group = await this.subjectGroupRepository.findById(
      id,
      organizationId
    );

    if (!group) {
      throw new NotFoundError('SubjectGroup', id);
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.reevaluateSchedules ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.delete(id, organizationId);
      return;
    }
    const yearIds =
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectGroupRepository.delete(id, organizationId, tx);
      const scheduleIds =
        await this.scheduleProvider!.handleSubjectGroupsDeletion(
          [id],
          organizationId,
          yearIds,
          tx
        );
      await this.reevaluateSchedules!.execute(scheduleIds, organizationId, tx);
    });
  }
}
