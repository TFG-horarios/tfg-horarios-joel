import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  degreesTable,
  type DrizzleDegree,
  type DrizzleNewDegree,
} from './drizzle.degree.schema';
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

  private mapToPersistence(domain: Degree): DrizzleNewDegree {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      code: domain.code,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  async findById(id: string, organizationId: string): Promise<Degree | null> {
    const rows = await this.database
      .select()
      .from(degreesTable)
      .where(
        and(
          eq(degreesTable.id, id),
          eq(degreesTable.organizationId, organizationId),
          isNull(degreesTable.deletedAt)
        )
      )
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
    try {
      await this.database
        .insert(degreesTable)
        .values(this.mapToPersistence(degree));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Un grado con el nombre '${degree.name}' o código '${degree.code}' ya existe en esta organización`
        );
      }
      throw error;
    }
  }

  async createMany(degrees: Degree[]): Promise<void> {
    if (degrees.length === 0) return;
    const valuesToInsert = degrees.map((d) => this.mapToPersistence(d));
    try {
      await this.database.insert(degreesTable).values(valuesToInsert);
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'Uno o más grados con el mismo nombre o código ya existen en esta organización'
        );
      }
      throw error;
    }
  }

  async update(degree: Degree): Promise<void> {
    const rawData = this.mapToPersistence(degree);
    try {
      await this.database
        .update(degreesTable)
        .set({
          name: rawData.name,
          code: rawData.code,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(degreesTable.id, degree.id),
            eq(degreesTable.organizationId, degree.organizationId)
          )
        );
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Un grado con el nombre '${degree.name}' o código '${degree.code}' ya existe en esta organización`
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .update(degreesTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(degreesTable.id, id),
          eq(degreesTable.organizationId, organizationId)
        )
      );
  }

  async deleteAll(organizationId: string): Promise<void> {
    await this.database
      .update(degreesTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(degreesTable.organizationId, organizationId),
          isNull(degreesTable.deletedAt)
        )
      );
  }

  async replace(degrees: Degree[], organizationId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(degreesTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(degreesTable.organizationId, organizationId),
            isNull(degreesTable.deletedAt)
          )
        );

      if (degrees.length > 0) {
        const valuesToInsert = degrees.map((d) => this.mapToPersistence(d));
        try {
          await tx.insert(degreesTable).values(valuesToInsert);
        } catch (error: unknown) {
          if (getPostgresErrorCode(error) === '23505') {
            throw new ConflictError(
              'One or more degrees with the same name or code already exist in this organization'
            );
          }
          throw error;
        }
      }
    });
  }
}
