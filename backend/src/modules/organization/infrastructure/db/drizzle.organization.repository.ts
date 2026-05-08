import { eq } from 'drizzle-orm';
import { type DbConnection } from '@/core/db/connection';
import {
  organizationsTable,
  type DrizzleOrganization,
} from './drizzle.organization.schema';
import { membersTable } from '@/modules/member/infrastructure/db/drizzle.member.schema';
import { type IOrganizationRepository } from '../../domain/organization.repository';
import { Organization } from '../../domain/organization.entity';
import type { Member } from '@/modules/member/domain/member.entity';

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
    const rows = await this.database
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Organization[]> {
    const rows = await this.database
      .select({
        organization: organizationsTable,
      })
      .from(organizationsTable)
      .innerJoin(
        membersTable,
        eq(organizationsTable.id, membersTable.organizationId)
      )
      .where(eq(membersTable.userId, userId));
    return rows.map((row) => this.mapToDomain(row.organization));
  }

  async create(organization: Organization, adminMember: Member): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.insert(organizationsTable).values({
        id: organization.id,
        name: organization.name,
        periodType: organization.periodType,
        morningStart: organization.morningStart,
        afternoonStart: organization.afternoonStart,
        morningEnd: organization.morningEnd,
        afternoonEnd: organization.afternoonEnd,
        slotDurationMinutes: organization.slotDurationMinutes,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      });

      await tx.insert(membersTable).values({
        id: adminMember.id,
        organizationId: adminMember.organizationId,
        userId: adminMember.userId,
        role: adminMember.role,
        createdAt: adminMember.createdAt,
        updatedAt: adminMember.updatedAt,
      });
    });
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, id));
  }

  async update(domainEntity: Organization): Promise<void> {
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
      })
      .where(eq(organizationsTable.id, domainEntity.id));
  }
}
