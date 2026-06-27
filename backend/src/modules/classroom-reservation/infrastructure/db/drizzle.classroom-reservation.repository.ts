import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { IClassroomReservationRepository } from '../../domain/classroom-reservation.repository';
import { ClassroomReservation } from '../../domain/classroom-reservation.entity';
import { classroomReservations } from './drizzle.classroom-reservation.schema';
import type {
  ClassroomReservationListQueryDTO,
  ClassroomReservationStatusDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { DbConnection } from '@/core/db/connection';
import type { DrizzleClassroomReservation } from './drizzle.classroom-reservation.schema';

export class DrizzleClassroomReservationRepository implements IClassroomReservationRepository {
  constructor(private readonly db: DbConnection) {}

  private mapToDomain(row: DrizzleClassroomReservation): ClassroomReservation {
    return ClassroomReservation.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      requesterUserId: row.requesterUserId,
      classroomId: row.classroomId,
      academicYearId: row.academicYearId,
      date: row.date,
      slotIndex: row.slotIndex,
      startTimeMinutes: row.startTimeMinutes,
      endTimeMinutes: row.endTimeMinutes,
      status: row.status as ClassroomReservationStatusDTO,
      reason: row.reason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<ClassroomReservation | null> {
    const [row] = await this.db
      .select()
      .from(classroomReservations)
      .where(eq(classroomReservations.id, id));

    if (!row) {
      return null;
    }

    return this.mapToDomain(row);
  }

  async save(reservation: ClassroomReservation): Promise<void> {
    await this.db.insert(classroomReservations).values({
      id: reservation.id,
      organizationId: reservation.organizationId,
      requesterUserId: reservation.requesterUserId,
      classroomId: reservation.classroomId,
      academicYearId: reservation.academicYearId,
      date: reservation.date,
      slotIndex: reservation.slotIndex,
      startTimeMinutes: reservation.startTimeMinutes,
      endTimeMinutes: reservation.endTimeMinutes,
      status: reservation.status,
      reason: reservation.reason,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    });
  }

  async update(reservation: ClassroomReservation): Promise<void> {
    await this.db
      .update(classroomReservations)
      .set({
        status: reservation.status,
        reason: reservation.reason,
        startTimeMinutes: reservation.startTimeMinutes,
        endTimeMinutes: reservation.endTimeMinutes,
        updatedAt: reservation.updatedAt,
      })
      .where(eq(classroomReservations.id, reservation.id));
  }

  async findPaginated(
    organizationId: string,
    query: ClassroomReservationListQueryDTO,
    requesterUserId?: string
  ): Promise<PaginatedResponse<ClassroomReservation>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(classroomReservations.organizationId, organizationId),
    ];

    if (requesterUserId) {
      conditions.push(
        eq(classroomReservations.requesterUserId, requesterUserId)
      );
    }
    if (query.classroomId) {
      conditions.push(eq(classroomReservations.classroomId, query.classroomId));
    }
    if (query.academicYearId) {
      conditions.push(
        eq(classroomReservations.academicYearId, query.academicYearId)
      );
    }
    if (query.status) {
      conditions.push(eq(classroomReservations.status, query.status));
    }
    if (query.date) {
      conditions.push(eq(classroomReservations.date, query.date));
    }

    const whereClause = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(classroomReservations)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const rows = await this.db
      .select()
      .from(classroomReservations)
      .where(whereClause)
      .orderBy(desc(classroomReservations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map(this.mapToDomain),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findReservationsInDateRange(
    organizationId: string,
    classroomId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassroomReservation[]> {
    const rows = await this.db
      .select()
      .from(classroomReservations)
      .where(
        and(
          eq(classroomReservations.organizationId, organizationId),
          eq(classroomReservations.classroomId, classroomId),
          sql`${classroomReservations.date} >= ${startDate}`,
          sql`${classroomReservations.date} <= ${endDate}`
        )
      );

    return rows.map(this.mapToDomain.bind(this));
  }

  async rejectFutureReservationsForClassrooms(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any = this.db
  ): Promise<void> {
    if (classroomIds.length === 0 || activeAndFutureYearIds.length === 0) {
      return;
    }

    await tx
      .update(classroomReservations)
      .set({
        status: 'REJECTED',
        reason: 'Aula eliminada del sistema',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(classroomReservations.organizationId, organizationId),
          inArray(classroomReservations.classroomId, classroomIds),
          inArray(classroomReservations.academicYearId, activeAndFutureYearIds),
          inArray(classroomReservations.status, ['PENDING', 'ACCEPTED'])
        )
      );
  }
}
