import { Schedule } from './schedule.entity';
import type { ScheduleListQueryDTO } from '@tfg-horarios/shared';

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
  findPublishedByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYear: string,
    courseYear: number,
    period: number,
    shift: 'morning' | 'afternoon'
  ): Promise<Schedule | null>;
  findLatestVersionByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYear: string,
    courseYear: number,
    period: number,
    shift: 'morning' | 'afternoon'
  ): Promise<string | null>;
  findAll(
    organizationId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<void>;
  update(schedule: Schedule): Promise<void>;
  createSchedulesWithSlots(
    items: { schedule: Schedule; slots: CreateScheduleSlotInput[] }[]
  ): Promise<void>;
  publishAndArchive(
    toPublish: Schedule,
    toArchive: Schedule | null
  ): Promise<void>;
}
