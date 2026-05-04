import { eq } from 'drizzle-orm';
import { type DbConnection } from '../../../../core/db/connection';
import {
  organizationsTable,
  type DrizzleOrganization,
} from './drizzle.organization.schema';
import { type IOrganizationRepository } from '../../domain/organization.repository.interface';
import { Organization } from '../../domain/organization.entity';

export class DrizzleOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleOrganization): Organization {
    return Organization.reconstitute({
      id: row.id,
      name: row.name,
      periodType: row.periodType,
      morningStart: row.morningStart,
      afternoonStart: row.afternoonStart,
      morningEnd: row.morningEnd,
      afternoonEnd: row.afternoonEnd,
      slotDurationMinutes: row.slotDurationMinutes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Organization | null> {
    const result = await this.database
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, id))
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findAll(): Promise<Organization[]> {
    const results = await this.database.select().from(organizationsTable);
    return results.map((row) => this.mapToDomain(row));
  }

  async save(domainEntity: Organization): Promise<void> {
    const existing = await this.findById(domainEntity.id);

    if (existing) {
      await this.database
        .update(organizationsTable)
        .set({
          name: domainEntity.name,
          periodType: domainEntity.periodType,
          morningStart: domainEntity.morningStart,
          afternoonStart: domainEntity.afternoonStart,
          morningEnd: domainEntity.morningEnd,
          afternoonEnd: domainEntity.afternoonEnd,
          slotDurationMinutes: domainEntity.slotDurationMinutes,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(organizationsTable.id, domainEntity.id));
    } else {
      await this.database.insert(organizationsTable).values({
        id: domainEntity.id,
        name: domainEntity.name,
        periodType: domainEntity.periodType,
        morningStart: domainEntity.morningStart,
        afternoonStart: domainEntity.afternoonStart,
        morningEnd: domainEntity.morningEnd,
        afternoonEnd: domainEntity.afternoonEnd,
        slotDurationMinutes: domainEntity.slotDurationMinutes,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, id));
  }
}
