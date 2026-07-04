import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { ISubjectGroupScheduleProvider } from '../../domain/providers/subject-group-schedule.provider';

export class SubjectGroupScheduleAdapter implements ISubjectGroupScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly reevaluateSchedules: ReevaluateSchedulesUseCase
  ) {}

  async handleSubjectGroupsCreation(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void> {
    const scheduleIds =
      await this.scheduleRepository.addUnassignedSlotsForSubjectGroups!(
        subjectGroupIds,
        organizationId,
        activeAndFutureYearIds,
        tx
      );
    await this.reevaluateSchedules.execute(scheduleIds, organizationId, tx);
  }

  async handleSubjectGroupsDeletion(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void> {
    const scheduleIds =
      await this.scheduleRepository.deleteSlotsBySubjectGroups!(
        subjectGroupIds,
        organizationId,
        activeAndFutureYearIds,
        tx
      );
    await this.reevaluateSchedules.execute(scheduleIds, organizationId, tx);
  }

  async replaceSubjectGroups(
    deletedSubjectGroupIds: string[],
    createdSubjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void> {
    const deletedFrom =
      await this.scheduleRepository.deleteSlotsBySubjectGroups!(
        deletedSubjectGroupIds,
        organizationId,
        activeAndFutureYearIds,
        tx
      );
    const addedTo =
      await this.scheduleRepository.addUnassignedSlotsForSubjectGroups!(
        createdSubjectGroupIds,
        organizationId,
        activeAndFutureYearIds,
        tx
      );
    await this.reevaluateSchedules.execute(
      [...new Set([...deletedFrom, ...addedTo])],
      organizationId,
      tx
    );
  }
}
