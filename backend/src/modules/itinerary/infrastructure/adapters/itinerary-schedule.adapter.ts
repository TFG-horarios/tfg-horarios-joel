import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IItineraryScheduleProvider } from '../../domain/providers/itinerary-schedule.provider';

export class ItineraryScheduleAdapter implements IItineraryScheduleProvider {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  handleItinerariesDeletion(
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void> {
    return this.scheduleRepository.deleteSchedulesByDegreesOrItineraries!(
      [],
      itineraryIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }
}
