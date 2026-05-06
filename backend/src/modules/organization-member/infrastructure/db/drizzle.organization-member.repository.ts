import { eq, and } from 'drizzle-orm';
import { type DbConnection } from '../../../../core/db/connection';
import {
  organizationMembersTable as organizationMember,
  type DrizzleOrganizationMember,
} from './drizzle.organization-member.schema';
import { type IOrganizationMemberRepository } from '../../domain/organization-member.repository';
import {
  OrganizationMember,
  type UserRole,
} from '../../domain/organization-member.entity';

export class DrizzleOrganizationMemberRepository implements IOrganizationMemberRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleOrganizationMember): OrganizationMember {
    return OrganizationMember.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as UserRole,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<OrganizationMember | null> {
    const result = await this.database
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.id, id))
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findByUserInOrganization(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMember | null> {
    const result = await this.database
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, userId),
          eq(organizationMember.organizationId, organizationId)
        )
      )
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findByUserId(userId: string): Promise<OrganizationMember[]> {
    const results = await this.database
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, userId));
    return results.map((row) => this.mapToDomain(row));
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    const results = await this.database
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.organizationId, organizationId));
    return results.map((row) => this.mapToDomain(row));
  }

  async save(domainEntity: OrganizationMember): Promise<void> {
    const existing = await this.findById(domainEntity.id);

    if (existing) {
      await this.database
        .update(organizationMember)
        .set({
          role: domainEntity.role,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(organizationMember.id, domainEntity.id));
    } else {
      await this.database.insert(organizationMember).values({
        id: domainEntity.id,
        organizationId: domainEntity.organizationId,
        userId: domainEntity.userId,
        role: domainEntity.role,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(organizationMember)
      .where(eq(organizationMember.id, id));
  }
}
