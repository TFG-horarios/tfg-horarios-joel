export interface TimingChangeResult {
  scheduleIds: string[];
  classroomIds: string[];
  affectedUsers: { userId: string; reservationCount: number }[];
}

export interface IAcademicYearTimingChangeProvider {
  invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: any,
    timeConfigId?: string
  ): Promise<TimingChangeResult>;
}
