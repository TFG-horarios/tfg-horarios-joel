export interface ScheduleTimeConfigTimingChangeResult {
  scheduleIds: string[];
  classroomIds: string[];
  affectedUsers: { userId: string; reservationCount: number }[];
}

export interface IScheduleTimeConfigTimingChangeProvider {
  invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: any,
    timeConfigId?: string
  ): Promise<ScheduleTimeConfigTimingChangeResult>;
}
