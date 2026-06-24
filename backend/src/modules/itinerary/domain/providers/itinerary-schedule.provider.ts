export interface IItineraryScheduleProvider {
  handleItinerariesDeletion(
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void>;
}
