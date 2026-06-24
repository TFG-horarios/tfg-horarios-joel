import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/providers/degree-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IDegreeScheduleProvider } from '../domain/providers/degree-schedule.provider';

export class DeleteAllDegreesUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: IDegreeScheduleProvider,
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
        'You do not have permission to delete degrees in this organization.'
      );
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.degreeRepository.deleteAll(organizationId);
      return;
    }
    const degrees = await this.degreeRepository.findAll(organizationId, false);
    const yearIds =
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.degreeRepository.deleteAll(organizationId, tx);
      await this.scheduleProvider!.handleDegreesDeletion(
        degrees.map((degree) => degree.id),
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
