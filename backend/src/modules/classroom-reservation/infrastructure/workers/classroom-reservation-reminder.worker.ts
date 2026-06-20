import type { DbConnection } from '@/core/db/connection';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { notificationsTable } from '@/modules/notification/infrastructure/db/drizzle.notification.schema';
import { classroomReservations } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.schema';
import { eq, and, gte, lt } from 'drizzle-orm';

export class ClassroomReservationReminderWorker {
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private readonly db: DbConnection,
    private readonly createNotificationUseCase: CreateNotificationUseCase
  ) {}

  start() {
    this.runJob();
    this.intervalId = setInterval(() => this.runJob(), 1000 * 60 * 60);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async runJob() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

      const upcomingReservations = await this.db
        .select()
        .from(classroomReservations)
        .where(
          and(
            eq(classroomReservations.status, 'ACCEPTED'),
            eq(classroomReservations.date, tomorrowStr)
          )
        );

      if (upcomingReservations.length === 0) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      for (const res of upcomingReservations) {
        const existingReminders = await this.db
          .select({ id: notificationsTable.id })
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.userId, res.requesterUserId),
              eq(notificationsTable.title, 'Recordatorio de reserva'),
              gte(notificationsTable.createdAt, todayStart),
              lt(notificationsTable.createdAt, todayEnd)
            )
          )
          .limit(1);

        if (existingReminders.length === 0) {
          await this.createNotificationUseCase.execute({
            userId: res.requesterUserId,
            organizationId: res.organizationId,
            title: 'Recordatorio de reserva',
            message: `Tienes una reserva de aula aprobada para mañana (${tomorrowStr}). No olvides revisar los detalles.`,
            type: 'INFO',
          });
        }
      }
    } catch (error) {
      console.error(
        '[ClassroomReservationReminderWorker] Error executing job:',
        error
      );
    }
  }
}
