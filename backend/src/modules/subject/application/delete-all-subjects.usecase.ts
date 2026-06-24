import type { ISubjectRepository } from '../domain/subject.repository';
import type { ISubjectMemberProvider } from '../domain/providers/subject-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectScheduleProvider } from '../domain/providers/subject-schedule.provider';

export class DeleteAllSubjectsUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: ISubjectScheduleProvider,
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
        'You do not have permission to delete subjects in this organization.'
      );
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.reevaluateSchedules ||
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
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectRepository.deleteAll(organizationId, tx);
      const scheduleIds = await this.scheduleProvider!.handleSubjectsDeletion(
        subjects.map((subject) => subject.id),
        organizationId,
        yearIds,
        tx
      );
      await this.reevaluateSchedules!.execute(scheduleIds, organizationId, tx);
    });
  }
}
