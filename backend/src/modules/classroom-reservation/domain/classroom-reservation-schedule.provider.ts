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
  getClassroomScheduleSlots(
    organizationId: string,
    academicYearId: string,
    classroomId: string
  ): Promise<
    { dayOfWeek: number; slotIndex: number; duration: number; period: number }[]
  >;
}
