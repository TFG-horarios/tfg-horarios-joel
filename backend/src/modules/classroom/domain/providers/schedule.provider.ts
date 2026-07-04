export interface IScheduleProvider {
  handleClassroomsDeletion(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void>;
}
