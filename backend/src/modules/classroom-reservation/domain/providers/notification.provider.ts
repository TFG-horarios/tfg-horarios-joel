export interface INotificationProvider {
  notifyReservationRequested(
    userId: string,
    organizationId: string
  ): Promise<void>;

  notifyReservationStatusChanged(
    userId: string,
    organizationId: string,
    status: string,
    statusEs: string
  ): Promise<void>;
}
