import type { DbTransaction } from '@/core/db/transaction-runner';

export interface IScheduleProvider {
  handleDegreesDeletion(
    degreeIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
}
