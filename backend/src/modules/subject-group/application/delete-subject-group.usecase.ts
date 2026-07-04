import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';

export class DeleteSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider?: IAcademicYearProvider,
    private readonly scheduleProvider?: IScheduleProvider,
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
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.delete(id, organizationId);
      return;
    }
    const yearIds =
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectGroupRepository.delete(id, organizationId, tx);
      await this.scheduleProvider!.handleSubjectGroupsDeletion(
        [id],
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
