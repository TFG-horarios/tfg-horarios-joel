export interface ScheduleTimeConfigAcademicYearTiming {
  organizationId: string;
  centerOpeningTime: string;
  centerClosingTime: string;
  slotDurationMinutes: number;
  breakDurationMinutes: number;
}

export interface IScheduleTimeConfigAcademicYearProvider {
  getTiming(
    academicYearId: string
  ): Promise<ScheduleTimeConfigAcademicYearTiming | null>;
}
