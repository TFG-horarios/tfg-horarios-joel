import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/providers/itinerary-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IItineraryAcademicYearProvider } from '../domain/providers/itinerary-academic-year.provider';
import type { IItineraryScheduleProvider } from '../domain/providers/itinerary-schedule.provider';

export class DeleteAllItinerariesUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider,
    private readonly academicYearProvider?: IItineraryAcademicYearProvider,
    private readonly scheduleProvider?: IItineraryScheduleProvider,
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
        'You do not have permission to delete itineraries in this organization.'
      );
    }

    if (
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.itineraryRepository.deleteAll(organizationId);
      return;
    }
    const itineraries = await this.itineraryRepository.findAll(
      organizationId,
      false
    );
    const yearIds =
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.itineraryRepository.deleteAll(organizationId, tx);
      await this.scheduleProvider!.handleItinerariesDeletion(
        itineraries.map((itinerary) => itinerary.id),
        organizationId,
        yearIds,
        tx
      );
    });
  }
}
