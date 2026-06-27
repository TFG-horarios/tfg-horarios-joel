import type { ScheduleEngineGroupData } from './schedule-engine.provider';
import type { ClassroomType, Shift } from '@tfg-horarios/shared';

export interface ScheduleOrganizationConstraints {
  breakDurationMinutes: number;
  centerOpeningTime: string;
  centerClosingTime: string;
  slotDurationMinutes: number;
}

export interface ScheduleClassroomData {
  id: string;
  capacity: number;
  type: ClassroomType;
  floor: number;
}

export interface ScheduleTimeConfigData {
  id: string;
  degreeId: string;
  itineraryId: string | null;
  courseYear: number;
  period: number;
  shift: Shift;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakAfterSlot: number | null;
}

export interface IScheduleDataProvider {
  getTargetDegreeIds(organizationId: string): Promise<string[]>;
  getAvailableClassrooms(
    organizationId: string
  ): Promise<ScheduleClassroomData[]>;
  getGroupsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<ScheduleEngineGroupData[]>;
  getAcademicYearConstraints(
    academicYearId: string
  ): Promise<ScheduleOrganizationConstraints | null>;
  getScheduleTimeConfigs?(
    organizationId: string,
    academicYearId: string
  ): Promise<ScheduleTimeConfigData[]>;
  getMatchingPeriods(academicYearId: string, date: Date): Promise<number[]>;
  rejectConflictingReservationsBatch(
    organizationId: string,
    academicYearId: string,
    slots: {
      classroomId: string;
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
      period: number;
      timeConfigId?: string;
      startTimeMinutes?: number;
      endTimeMinutes?: number;
    }[]
  ): Promise<void>;
}
