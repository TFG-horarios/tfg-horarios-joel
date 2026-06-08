import type {
  ClassroomConfigurationListQueryDTO,
  ClassroomScheduleQueryDTO,
  PaginatedResponse,
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
      academicYear: string;
      shift: 'morning' | 'afternoon';
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
    academicYear: string,
    shift: 'morning' | 'afternoon',
    originalClassroomId: string | null,
    originalDayOfWeek: number | null,
    originalSlotIndex: number | null,
    duration: number
  ): Promise<ScheduleSlot[]>;
  create(slot: ScheduleSlot): Promise<void>;
  createMany(slots: ScheduleSlot[]): Promise<void>;
  update(slot: ScheduleSlot): Promise<void>;
  delete(id: string): Promise<void>;
}
