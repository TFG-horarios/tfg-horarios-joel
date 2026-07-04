import type { DbTransaction } from '@/core/db/transaction-runner';

export interface IScheduleProvider {
  handleSubjectGroupsCreation(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
  handleSubjectGroupsDeletion(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
  replaceSubjectGroups(
    deletedSubjectGroupIds: string[],
    createdSubjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
}
