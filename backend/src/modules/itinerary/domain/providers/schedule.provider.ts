import type { DbTransaction } from '@/core/db/transaction-runner';

export interface IScheduleProvider {
  handleItinerariesDeletion(
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
}
