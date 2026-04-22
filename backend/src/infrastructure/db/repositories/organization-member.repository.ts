import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import { organizationMember, OrganizationMember as DrizzleMember } from '../schema/organization-member.schema';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository';
import { OrganizationMember, UserRole } from '../../../domain/entities/organization-member.entity';

export class OrganizationMemberRepository implements IOrganizationMemberRepository {
  private mapToDomain(row: DrizzleMember): OrganizationMember {
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
    const result = await db.select().from(organizationMember).where(eq(organizationMember.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByUserInOrganization(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    const result = await db.select()
        .from(organizationMember)
        .where(
            and(
                eq(organizationMember.userId, userId),
                eq(organizationMember.organizationId, organizationId)
            )
        )
        .limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByUserId(userId: string): Promise<OrganizationMember[]> {
    const results = await db.select().from(organizationMember).where(eq(organizationMember.userId, userId));
    return results.map(row => this.mapToDomain(row));
  }

  async findByOrganizationId(organizationId: string): Promise<OrganizationMember[]> {
    const results = await db.select().from(organizationMember).where(eq(organizationMember.organizationId, organizationId));
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: OrganizationMember): Promise<void> {
    const existing = await this.findById(domainEntity.id);
    
    if (existing) {
      await db.update(organizationMember)
        .set({
          role: domainEntity.role,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(organizationMember.id, domainEntity.id));
    } else {
      await db.insert(organizationMember).values({
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
    await db.delete(organizationMember).where(eq(organizationMember.id, id));
  }
}
