import { Schedule } from './schedule.entity';
import type {
  ScheduleListQueryDTO,
  PaginatedResponse,
  AcademicYear,
} from '@tfg-horarios/shared';

export interface CreateScheduleSlotInput {
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
}

export interface IScheduleRepository {
  findById(id: string, organizationId: string): Promise<Schedule | null>;
  findByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYear: string,
    courseYear: number,
    period: number,
    shift: 'morning' | 'afternoon'
  ): Promise<Schedule | null>;
  findDistinctAcademicYears(organizationId: string): Promise<AcademicYear[]>;
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
}
