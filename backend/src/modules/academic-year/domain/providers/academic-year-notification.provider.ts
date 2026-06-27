export interface IAcademicYearNotificationProvider {
  notifyReservationsCancelled(
    userId: string,
    organizationId: string,
    reservationCount: number
  ): Promise<void>;
}
