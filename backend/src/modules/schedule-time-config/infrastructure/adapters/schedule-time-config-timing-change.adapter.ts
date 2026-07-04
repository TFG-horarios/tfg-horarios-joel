import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IAcademicYearTimingChangeProvider } from '@/modules/academic-year/domain/providers/timing-change.provider';
import type { IScheduleTimeConfigTimingChangeProvider } from '../../domain/providers/schedule-time-config-timing-change.provider';

export class ScheduleTimeConfigTimingChangeAdapter implements IScheduleTimeConfigTimingChangeProvider {
  constructor(
    private readonly timingChangeProvider: IAcademicYearTimingChangeProvider
  ) {}

  invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: DbTransaction,
    timeConfigId?: string
  ) {
    return this.timingChangeProvider.invalidateForTimingChange(
      organizationId,
      academicYearId,
      tx,
      timeConfigId
    );
  }
}
