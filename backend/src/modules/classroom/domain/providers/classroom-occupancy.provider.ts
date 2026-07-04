import type { ClassroomScheduleQueryDTO, Shift } from '@tfg-horarios/shared';

export interface ClassroomOccupancySchedule {
  id: string;
  academicYear: {
    slotDurationMinutes: number;
    breakDurationMinutes: number;
  };
  timeConfig: {
    startTime: string;
    endTime: string;
    hasBreak: boolean;
    breakAfterSlot: number | null;
  };
  period: number;
  shift: Shift;
  slots: Array<{
    id: string;
    classroomId: string | null;
    subjectGroupId: string;
    dayOfWeek: number | null;
    slotIndex: number | null;
    duration: number;
  }>;
}

export interface IClassroomOccupancyProvider {
  findOccupancySchedules(
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ClassroomOccupancySchedule[]>;
}
