export interface IScheduleProvider {
  hasSubjectInInterval(
    organizationId: string,
    academicYearId: string,
    periods: number[],
    classroomId: string,
    dayOfWeek: number,
    startTimeMinutes: number,
    endTimeMinutes: number
  ): Promise<boolean>;
  areAllSchedulesPublished(
    organizationId: string,
    academicYearId: string
  ): Promise<boolean>;
  getClassroomScheduleSlots(
    organizationId: string,
    academicYearId: string,
    classroomId: string
  ): Promise<
    {
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
      period: number;
      startTimeMinutes: number;
      endTimeMinutes: number;
    }[]
  >;
}
