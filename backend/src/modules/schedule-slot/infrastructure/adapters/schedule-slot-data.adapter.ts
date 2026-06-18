import type {
  IScheduleSlotDataProvider,
  IScheduleSlotContext,
} from '../../domain/schedule-slot-data.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleDataProvider } from '@/modules/schedule/domain/schedule-data.provider';

export class ScheduleSlotDataAdapter implements IScheduleSlotDataProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleDataProvider: IScheduleDataProvider
  ) {}

  async getScheduleContext(
    scheduleId: string,
    organizationId: string
  ): Promise<IScheduleSlotContext | null> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return null;

    return {
      academicYearId: schedule.academicYearId,
      shift: schedule.shift,
    };
  }

  async isGroupCommon(
    subjectGroupId: string,
    scheduleId: string,
    organizationId: string
  ): Promise<boolean> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return false;

    const groupsData = await this.scheduleDataProvider.getGroupsInScope(
      organizationId,
      schedule.period,
      [schedule.degreeId],
      undefined,
      [schedule.courseYear]
    );

    const group = groupsData.find((g) => g.subjectGroupId === subjectGroupId);
    return group ? group.isCommon : false;
  }

  async unpublishSchedule(
    scheduleId: string,
    organizationId: string
  ): Promise<void> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return;

    if (schedule.status === 'published') {
      schedule.markAsDraft();
      await this.scheduleRepository.update(schedule);
    }
  }
}
