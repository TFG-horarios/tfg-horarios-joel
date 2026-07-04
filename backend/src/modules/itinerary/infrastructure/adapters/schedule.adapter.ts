import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleProvider } from '../../domain/providers/schedule.provider';

export class ScheduleAdapter implements IScheduleProvider {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  handleItinerariesDeletion(
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
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
