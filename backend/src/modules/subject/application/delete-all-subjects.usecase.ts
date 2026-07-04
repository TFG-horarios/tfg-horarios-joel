import type { ISubjectRepository } from '../domain/subject.repository';
import type { ISubjectMemberProvider } from '../domain/providers/subject-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectAcademicYearProvider } from '../domain/providers/subject-academic-year.provider';
import type { ISubjectScheduleProvider } from '../domain/providers/subject-schedule.provider';

export class DeleteAllSubjectsUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider,
    private readonly academicYearProvider?: ISubjectAcademicYearProvider,
    private readonly scheduleProvider?: ISubjectScheduleProvider,
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
        'You do not have permission to delete subjects in this organization.'
      );
    }

    if (
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectRepository.deleteAll(organizationId);
      return;
    }
    const subjects = await this.subjectRepository.findAll(
      organizationId,
      false
    );
    const yearIds =
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectRepository.deleteAll(organizationId, tx);
      await this.scheduleProvider!.handleSubjectsDeletion(
        subjects.map((subject) => subject.id),
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
