import { Schedule } from './schedule.entity';
import type {
  ScheduleListQueryDTO,
  PaginatedResponse,
  Shift,
  ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
import type { ScheduleEngineAssignment } from './schedule-engine.provider';

export interface CreateScheduleSlotInput {
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  conflicts: ScheduleConflictDetailDTO[];
}

export interface IScheduleRepository {
  findById(id: string, organizationId: string): Promise<Schedule | null>;
  findByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYearId: string,
    courseYear: number,
    period: number,
    shift: Shift
  ): Promise<Schedule | null>;
  findDistinctAcademicYears(organizationId: string): Promise<string[]>;
  findAll(organizationId: string): Promise<Schedule[]>;
  findPaginated(
    organizationId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<PaginatedResponse<Schedule>>;
  create(schedule: Schedule): Promise<void>;
  update(schedule: Schedule): Promise<void>;
  createSchedulesWithSlots(
    items: { schedule: Schedule; slots: CreateScheduleSlotInput[] }[]
  ): Promise<void>;
  findLockedAssignments(
    organizationId: string,
    academicYearId: string,
    period: number,
    excludeScheduleIds: string[]
  ): Promise<ScheduleEngineAssignment[]>;
  delete(id: string, organizationId: string): Promise<void>;
}
