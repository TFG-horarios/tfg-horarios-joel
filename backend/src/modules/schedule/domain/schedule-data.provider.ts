import type { ScheduleEngineGroupData } from './schedule-engine.provider';

export interface ScheduleOrganizationConstraints {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  slotDurationMinutes: number;
}

export interface ScheduleClassroomData {
  id: string;
  capacity: number;
  type: 'theory' | 'lab';
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
}
