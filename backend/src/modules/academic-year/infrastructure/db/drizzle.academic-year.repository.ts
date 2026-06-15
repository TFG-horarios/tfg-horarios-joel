import type { DbConnection } from '@/core/db/connection';
import { eq } from 'drizzle-orm';
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
      morningStart: row.morningStart,
      morningEnd: row.morningEnd,
      afternoonStart: row.afternoonStart,
      afternoonEnd: row.afternoonEnd,
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
      morningStart: academicYear.morningStart,
      morningEnd: academicYear.morningEnd,
      afternoonStart: academicYear.afternoonStart,
      afternoonEnd: academicYear.afternoonEnd,
      slotDurationMinutes: academicYear.slotDurationMinutes,
      createdAt: academicYear.createdAt,
      updatedAt: academicYear.updatedAt,
    });
  }

  async update(academicYear: AcademicYear): Promise<void> {
    await this.db
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
        morningStart: academicYear.morningStart,
        morningEnd: academicYear.morningEnd,
        afternoonStart: academicYear.afternoonStart,
        afternoonEnd: academicYear.afternoonEnd,
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

  async delete(id: string): Promise<void> {
    await this.db
      .delete(academicYearsTable)
      .where(eq(academicYearsTable.id, id));
  }
}
