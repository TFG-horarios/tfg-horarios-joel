export interface IClassroomReservationScheduleProvider {
  hasSubjectInSlot(
    organizationId: string,
    academicYearId: string,
    periods: number[],
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number
  ): Promise<boolean>;
  areAllSchedulesPublished(
    organizationId: string,
    academicYearId: string
  ): Promise<boolean>;
}
