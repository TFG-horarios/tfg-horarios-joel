import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IDegreeScheduleProvider } from '../../domain/providers/degree-schedule.provider';

export class DegreeScheduleAdapter implements IDegreeScheduleProvider {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  handleDegreesDeletion(
    degreeIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void> {
    return this.scheduleRepository.deleteSchedulesByDegreesOrItineraries!(
      degreeIds,
      [],
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }
}
