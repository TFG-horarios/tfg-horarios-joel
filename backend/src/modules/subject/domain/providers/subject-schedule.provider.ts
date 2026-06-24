export interface ISubjectScheduleProvider {
  handleSubjectsDeletion(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]>;
}
