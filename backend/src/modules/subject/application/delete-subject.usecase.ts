import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { ISubjectMemberProvider } from '../domain/providers/subject-member.provider';
import type { ISubjectRepository } from '../domain/subject.repository';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectAcademicYearProvider } from '../domain/providers/subject-academic-year.provider';
import type { ISubjectScheduleProvider } from '../domain/providers/subject-schedule.provider';

export class DeleteSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider,
    private readonly academicYearProvider?: ISubjectAcademicYearProvider,
    private readonly scheduleProvider?: ISubjectScheduleProvider,
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
