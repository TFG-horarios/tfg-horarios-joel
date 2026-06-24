import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/providers/itinerary-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IItineraryScheduleProvider } from '../domain/providers/itinerary-schedule.provider';

export class DeleteItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: IItineraryScheduleProvider,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    itineraryId: string,
    requesterUserId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete itineraries in this organization.'
      );
    }

    const itinerary = await this.itineraryRepository.findById(
      itineraryId,
      organizationId,
      false
    );
    if (!itinerary) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.itineraryRepository.delete(itineraryId, organizationId);
      return;
    }
    const yearIds =
      await this.academicYearRepository.findActiveAndFutureIds!(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.itineraryRepository.delete(itineraryId, organizationId, tx);
      await this.scheduleProvider!.handleItinerariesDeletion(
        [itineraryId],
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
