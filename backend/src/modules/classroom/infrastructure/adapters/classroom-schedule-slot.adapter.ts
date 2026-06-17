import type { IClassroomScheduleSlotProvider } from '../../domain/classroom-schedule-slot.provider';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import type {
  ClassroomConfigurationListQueryDTO,
  PaginatedResponse,
  ClassroomScheduleQueryDTO,
  ScheduleSlotDTO,
  Shift,
} from '@tfg-horarios/shared';
import { ScheduleSlotMapper } from '@/modules/schedule-slot/application/schedule-slot.mapper';

export class ClassroomScheduleSlotAdapter implements IClassroomScheduleSlotProvider {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository
  ) {}

  async findActiveClassroomConfigurationsPaginated(
    organizationId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYearId: string;
      shift: Shift;
      period: number;
    }>
  > {
    return this.scheduleSlotRepository.findActiveClassroomConfigurationsPaginated(
      organizationId,
      filters
    );
  }

  async findUniqueSlotsByClassroomIdAndFilters(
    classroomId: string,
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlotDTO[]> {
    const slots =
      await this.scheduleSlotRepository.findSlotsByClassroomIdAndFilters(
        classroomId,
        organizationId,
        filters
      );

    const uniqueSlotsMap = new Map<string, (typeof slots)[0]>();
    for (const slot of slots) {
      const key = `${slot.dayOfWeek}-${slot.slotIndex}-${slot.subjectGroupId}`;
      if (!uniqueSlotsMap.has(key)) {
        uniqueSlotsMap.set(key, slot);
      }
    }

    return Array.from(uniqueSlotsMap.values()).map(ScheduleSlotMapper.toDTO);
  }
}
