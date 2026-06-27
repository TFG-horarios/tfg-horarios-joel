import type { DbConnection } from '@/core/db/connection';
import { and, eq, gte, or, sql } from 'drizzle-orm';
import { AcademicYear } from '../../domain/academic-year.entity';
import type { IAcademicYearRepository } from '../../domain/academic-year.repository';
import {
  academicYearsTable,
  type DrizzleAcademicYear,
} from './drizzle.academic-year.schema';

export class DrizzleAcademicYearRepository implements IAcademicYearRepository {
  constructor(private readonly db: DbConnection) {}

  private mapToDomain(row: DrizzleAcademicYear): AcademicYear {
    return AcademicYear.create({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      period0Start: row.period0Start,
      period0End: row.period0End,
      period1Start: row.period1Start,
      period1End: row.period1End,
      period2Start: row.period2Start,
      period2End: row.period2End,
      periodType: row.periodType,
      breakDurationMinutes: row.breakDurationMinutes,
      centerOpeningTime: row.centerOpeningTime,
      centerClosingTime: row.centerClosingTime,
      slotDurationMinutes: row.slotDurationMinutes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(academicYear: AcademicYear): Promise<void> {
    await this.db.insert(academicYearsTable).values({
      id: academicYear.id,
      organizationId: academicYear.organizationId,
      name: academicYear.name,
      isActive: academicYear.isActive,
      period0Start: academicYear.period0Start,
      period0End: academicYear.period0End,
      period1Start: academicYear.period1Start,
      period1End: academicYear.period1End,
      period2Start: academicYear.period2Start,
      period2End: academicYear.period2End,
      periodType: academicYear.periodType,
      breakDurationMinutes: academicYear.breakDurationMinutes,
      centerOpeningTime: academicYear.centerOpeningTime,
      centerClosingTime: academicYear.centerClosingTime,
      slotDurationMinutes: academicYear.slotDurationMinutes,
      createdAt: academicYear.createdAt,
      updatedAt: academicYear.updatedAt,
    });
  }

  async update(
    academicYear: AcademicYear,
    tx: DbConnection = this.db
  ): Promise<void> {
    await tx
      .update(academicYearsTable)
      .set({
        name: academicYear.name,
        isActive: academicYear.isActive,
        period0Start: academicYear.period0Start,
        period0End: academicYear.period0End,
        period1Start: academicYear.period1Start,
        period1End: academicYear.period1End,
        period2Start: academicYear.period2Start,
        period2End: academicYear.period2End,
        periodType: academicYear.periodType,
        breakDurationMinutes: academicYear.breakDurationMinutes,
        centerOpeningTime: academicYear.centerOpeningTime,
        centerClosingTime: academicYear.centerClosingTime,
        slotDurationMinutes: academicYear.slotDurationMinutes,
        updatedAt: academicYear.updatedAt,
      })
      .where(eq(academicYearsTable.id, academicYear.id));
  }

  async findById(id: string): Promise<AcademicYear | null> {
    const row = await this.db
      .select()
      .from(academicYearsTable)
      .where(eq(academicYearsTable.id, id));

    return row[0] ? this.mapToDomain(row[0]) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<AcademicYear[]> {
    const rows = await this.db
      .select()
      .from(academicYearsTable)
      .where(eq(academicYearsTable.organizationId, organizationId))
      .orderBy(academicYearsTable.name);

    return rows.map(this.mapToDomain);
  }

  async findActiveByOrganizationId(
    organizationId: string
  ): Promise<AcademicYear | null> {
    const all = await this.findByOrganizationId(organizationId);
    return all.find((ay) => ay.isActive) || null;
  }

  async findActiveAndFutureIds(organizationId: string): Promise<string[]> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.db
      .select({ id: academicYearsTable.id })
      .from(academicYearsTable)
      .where(
        and(
          eq(academicYearsTable.organizationId, organizationId),
          or(
            eq(academicYearsTable.isActive, true),
            gte(
              sql<string>`COALESCE(${academicYearsTable.period2End}, ${academicYearsTable.period1End}, ${academicYearsTable.period0End})`,
              today
            )
          )
        )
      );

    return rows.map((row) => row.id);
  }

  async isHistoric(id: string): Promise<boolean> {
    const row = await this.db
      .select({
        period0End: academicYearsTable.period0End,
        period1End: academicYearsTable.period1End,
        period2End: academicYearsTable.period2End,
      })
      .from(academicYearsTable)
      .where(eq(academicYearsTable.id, id))
      .limit(1);

    const academicYear = row[0];
    if (!academicYear) return false;

    const latestEnd = [
      academicYear.period0End,
      academicYear.period1End,
      academicYear.period2End,
    ]
      .filter((date): date is string => date !== null)
      .sort()
      .at(-1);

    const today = new Date().toISOString().slice(0, 10);
    return latestEnd !== undefined && latestEnd < today;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(academicYearsTable)
      .where(eq(academicYearsTable.id, id));
  }
}
