import { eq, and, desc, sql } from 'drizzle-orm';
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

  async hasAcceptedFutureReservation(
    organizationId: string,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number
  ): Promise<boolean> {
    const postgresDow = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

    const todayDateStr = new Date().toISOString().split('T')[0];

    const [row] = await this.db
      .select({ id: classroomReservations.id })
      .from(classroomReservations)
      .where(
        and(
          eq(classroomReservations.organizationId, organizationId),
          eq(classroomReservations.classroomId, classroomId),
          eq(classroomReservations.slotIndex, slotIndex),
          eq(classroomReservations.status, 'ACCEPTED'),
          sql`${classroomReservations.date} >= ${todayDateStr}`,
          sql`EXTRACT(DOW FROM ${classroomReservations.date}::date) = ${postgresDow}`
        )
      )
      .limit(1);

    return !!row;
  }
}
