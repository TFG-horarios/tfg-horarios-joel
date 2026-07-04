import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';

export class DeleteAllSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider?: IAcademicYearProvider,
    private readonly scheduleProvider?: IScheduleProvider,
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
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
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
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectGroupRepository.deleteAll(organizationId, tx);
      await this.scheduleProvider!.handleSubjectGroupsDeletion(
        groups.map((group) => group.id),
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
