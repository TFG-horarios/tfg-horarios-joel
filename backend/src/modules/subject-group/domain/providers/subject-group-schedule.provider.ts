export interface ISubjectGroupScheduleProvider {
  handleSubjectGroupsCreation(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]>;
  handleSubjectGroupsDeletion(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]>;
}
