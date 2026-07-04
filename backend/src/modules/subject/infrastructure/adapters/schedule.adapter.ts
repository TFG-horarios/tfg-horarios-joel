import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { IScheduleProvider } from '../../domain/providers/schedule.provider';

export class ScheduleAdapter implements IScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly reevaluateSchedules: ReevaluateSchedulesUseCase
  ) {}

  async handleSubjectsDeletion(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void> {
    const scheduleIds = await this.scheduleRepository.deleteSlotsBySubjects!(
      subjectIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
    await this.reevaluateSchedules.execute(scheduleIds, organizationId, tx);
  }
}
