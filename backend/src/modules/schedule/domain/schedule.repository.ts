import type { DbTransaction } from '@/core/db/transaction-runner';
import { Schedule } from './schedule.entity';
import type {
  ScheduleListQueryDTO,
  PaginatedResponse,
  Shift,
  ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
import type { ScheduleEngineAssignment } from './providers/schedule-engine.provider';

export interface CreateScheduleSlotInput {
  id?: string;
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  conflicts: ScheduleConflictDetailDTO[];
}

export interface CreateScheduleSlotInclusionInput {
  scheduleId: string;
  slotId: string;
  conflicts: ScheduleConflictDetailDTO[];
}

export interface ScheduleIssueData {
  scheduleId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  conflicts: ScheduleConflictDetailDTO[];
}

export interface ScheduleMetrics {
  scheduleId: string;
  conflicts: number;
  unassigned: number;
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
  findAll(organizationId: string): Promise<Schedule[]>;
  findPaginated(
    organizationId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<PaginatedResponse<Schedule>>;
  update(schedule: Schedule): Promise<void>;
  updateConflictsAndUnassignedCount?(
    scheduleId: string,
    organizationId: string
  ): Promise<void>;
  createSchedulesWithSlots(
    items: {
      schedule: Schedule;
      slots: CreateScheduleSlotInput[];
      inclusions?: CreateScheduleSlotInclusionInput[];
    }[],
    additionalInclusions?: CreateScheduleSlotInclusionInput[]
  ): Promise<void>;
  findLockedAssignments(
    organizationId: string,
    academicYearId: string,
    period: number,
    excludeScheduleIds: string[]
  ): Promise<ScheduleEngineAssignment[]>;
  delete(id: string, organizationId: string): Promise<void>;
  unassignClassroomsFromSlots?(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<string[]>;
  deleteSchedulesByDegreesOrItineraries?(
    degreeIds: string[],
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<void>;
  deleteSlotsBySubjects?(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<string[]>;
  deleteSlotsBySubjectGroups?(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<string[]>;
  addUnassignedSlotsForSubjectGroups?(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<string[]>;
  findScheduleIssueData?(
    scheduleIds: string[],
    organizationId: string,
    tx?: DbTransaction
  ): Promise<ScheduleIssueData[]>;
  updateSchedulesMetrics?(
    metrics: ScheduleMetrics[],
    organizationId: string,
    tx?: DbTransaction
  ): Promise<void>;
}
