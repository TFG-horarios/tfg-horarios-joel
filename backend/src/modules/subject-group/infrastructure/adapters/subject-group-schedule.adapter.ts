import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { ISubjectGroupScheduleProvider } from '../../domain/providers/subject-group-schedule.provider';

export class SubjectGroupScheduleAdapter implements ISubjectGroupScheduleProvider {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  handleSubjectGroupsCreation(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]> {
    return this.scheduleRepository.addUnassignedSlotsForSubjectGroups!(
      subjectGroupIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }

  handleSubjectGroupsDeletion(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]> {
    return this.scheduleRepository.deleteSlotsBySubjectGroups!(
      subjectGroupIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }
}
