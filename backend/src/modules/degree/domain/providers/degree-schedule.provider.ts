export interface IDegreeScheduleProvider {
  handleDegreesDeletion(
    degreeIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void>;
}
