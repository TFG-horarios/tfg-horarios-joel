import { eq, desc, and, lt, count } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import type { INotificationRepository } from '../../domain/notification.repository';
import { Notification } from '../../domain/notification.entity';
import {
  notificationsTable,
  type DrizzleNotification,
} from './drizzle.notification.schema';
import type {
  NotificationTypeDTO,
  PaginatedResponse,
  NotificationListQueryDTO,
} from '@tfg-horarios/shared';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import { ConflictError } from '@/core/errors/app.error';

export class DrizzleNotificationRepository implements INotificationRepository {
  constructor(private readonly db: DbConnection) {}

  private mapToDomain(row: DrizzleNotification): Notification {
    return Notification.reconstitute({
      id: row.id,
      userId: row.userId,
      organizationId: row.organizationId,
      title: row.title,
      message: row.message,
      type: row.type as NotificationTypeDTO,
      isRead: row.isRead,
      createdAt: row.createdAt,
    });
  }

  async create(notification: Notification): Promise<void> {
    try {
      await this.db.insert(notificationsTable).values({
        userId: notification.userId,
        organizationId: notification.organizationId ?? null,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      });
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError('Una notificación con el mismo ID ya existe');
      }
      throw error;
    }
  }

  async listByUserId(
    userId: string,
    filters?: NotificationListQueryDTO
  ): Promise<PaginatedResponse<Notification>> {
    const countResult = await this.db
      .select({ total: count() })
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId));
    const total = countResult[0]?.total ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => this.mapToDomain(row)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const [row] = await this.db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, userId)
        )
      )
      .returning();

    if (!row) {
      throw new Error('Notification not found');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.isRead, false)
        )
      );
  }

  async deleteOldNotifications(days: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    await this.db
      .delete(notificationsTable)
      .where(lt(notificationsTable.createdAt, date));
  }
}
