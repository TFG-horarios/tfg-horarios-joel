import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { degreesTable, type DrizzleDegree } from './drizzle.degree.schema';
import type { IDegreeRepository } from '../../domain/degree.repository';
import { Degree } from '../../domain/degree.entity';

export class DrizzleDegreeRepository implements IDegreeRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleDegree): Degree {
    return Degree.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      code: row.code,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  async findById(id: string): Promise<Degree | null> {
    const rows = await this.database
      .select()
      .from(degreesTable)
      .where(and(eq(degreesTable.id, id), isNull(degreesTable.deletedAt)))
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<Degree[]> {
    const rows = await this.database
      .select()
      .from(degreesTable)
      .where(
        and(
          eq(degreesTable.organizationId, organizationId),
          isNull(degreesTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(degree: Degree): Promise<void> {
    await this.database.insert(degreesTable).values(degree);
  }

  async createMany(degrees: Degree[]): Promise<void> {
    if (degrees.length === 0) return;
    await this.database.transaction(async (tx) => {
      await tx.insert(degreesTable).values(degrees);
    });
  }

  async update(degree: Degree): Promise<void> {
    await this.database
      .update(degreesTable)
      .set({
        name: degree.name,
        code: degree.code,
        updatedAt: new Date(),
      })
      .where(eq(degreesTable.id, degree.id));
  }

  async delete(id: string): Promise<void> {
    await this.database
      .update(degreesTable)
      .set({ deletedAt: new Date() })
      .where(eq(degreesTable.id, id));
  }
}
