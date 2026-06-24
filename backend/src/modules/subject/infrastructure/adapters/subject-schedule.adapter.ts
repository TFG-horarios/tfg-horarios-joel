import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { ISubjectScheduleProvider } from '../../domain/providers/subject-schedule.provider';

export class SubjectScheduleAdapter implements ISubjectScheduleProvider {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  handleSubjectsDeletion(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]> {
    return this.scheduleRepository.deleteSlotsBySubjects!(
      subjectIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }
}
