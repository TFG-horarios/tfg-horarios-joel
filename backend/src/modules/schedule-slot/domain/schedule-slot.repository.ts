import type {
  ClassroomConfigurationListQueryDTO,
  ClassroomScheduleQueryDTO,
  PaginatedResponse,
  Shift,
} from '@tfg-horarios/shared';
import { ScheduleSlot } from './schedule-slot.entity';

export interface IScheduleSlotRepository {
  findById(id: string): Promise<ScheduleSlot | null>;
  findByScheduleId(scheduleId: string): Promise<ScheduleSlot[]>;
  findActiveClassroomConfigurationsPaginated(
    organizationId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYearId: string;
      shift: Shift;
      period: number;
    }>
  >;
  findSlotsByClassroomIdAndFilters(
    classroomId: string,
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlot[]>;
  findLinkedSlots(
    subjectGroupId: string,
    academicYearId: string,
    shift: Shift,
    originalClassroomId: string | null,
    originalDayOfWeek: number | null,
    originalSlotIndex: number | null,
    duration: number
  ): Promise<ScheduleSlot[]>;
  findScheduleIdsIncludingSlot(slotId: string): Promise<string[]>;
  clearInclusionConflictsForSlot(slotId: string): Promise<void>;
  create(slot: ScheduleSlot): Promise<void>;
  createMany(slots: ScheduleSlot[]): Promise<void>;
  update(slot: ScheduleSlot): Promise<void>;
  updateConflicts(slot: ScheduleSlot): Promise<void>;
  delete(id: string): Promise<void>;
}
