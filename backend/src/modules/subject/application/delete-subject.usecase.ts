import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { ISubjectRepository } from '../domain/subject.repository';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';

export class DeleteSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider?: IAcademicYearProvider,
    private readonly scheduleProvider?: IScheduleProvider,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string
  ): Promise<void> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete subjects in this organization.'
      );
    }

    const subject = await this.subjectRepository.findById(
      subjectId,
      organizationId
    );
    if (!subject) {
      throw new NotFoundError('Subject', subjectId);
    }

    if (
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectRepository.delete(subjectId, organizationId);
      return;
    }
    const yearIds =
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectRepository.delete(subjectId, organizationId, tx);
      await this.scheduleProvider!.handleSubjectsDeletion(
        [subjectId],
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
