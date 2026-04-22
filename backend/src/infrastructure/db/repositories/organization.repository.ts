import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { organization, Organization as DrizzleOrganization } from '../schema/organization.schema';
import { IOrganizationRepository } from '../../../domain/repositories/organization.repository';
import { Organization } from '../../../domain/entities/organization.entity';

export class OrganizationRepository implements IOrganizationRepository {
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
    const result = await db.select().from(organization).where(eq(organization.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findAll(): Promise<Organization[]> {
    const results = await db.select().from(organization);
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: Organization): Promise<void> {
    const existing = await this.findById(domainEntity.id);

    if (existing) {
      await db.update(organization)
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
        .where(eq(organization.id, domainEntity.id));
    } else {
      await db.insert(organization).values({
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
    await db.delete(organization).where(eq(organization.id, id));
  }
}
