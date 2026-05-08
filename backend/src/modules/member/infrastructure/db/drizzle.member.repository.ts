import { eq, and, count } from 'drizzle-orm';
import { type DbConnection } from '@/core/db/connection';
import { membersTable, type DrizzleMember } from './drizzle.member.schema';
import {
  type IMemberRepository,
  type MemberWithUserDetails,
} from '../../domain/member.repository';
import { Member } from '../../domain/member.entity';
import { type AppRole } from '@/core/permissions/roles';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';

export class DrizzleMemberRepository implements IMemberRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleMember): Member {
    return Member.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as AppRole,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByUserAndOrg(
    userId: string,
    organizationId: string
  ): Promise<Member | null> {
    const result = await this.database
      .select()
      .from(membersTable)
      .where(
        and(
          eq(membersTable.userId, userId),
          eq(membersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<MemberWithUserDetails[]> {
    const results = await this.database
      .select({
        member: membersTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(membersTable)
      .innerJoin(usersTable, eq(membersTable.userId, usersTable.id))
      .where(eq(membersTable.organizationId, organizationId));
    return results.map((row) => ({
      member: this.mapToDomain(row.member),
      userName: row.userName,
      userEmail: row.userEmail,
    }));
  }

  async create(domainEntity: Member): Promise<void> {
    await this.database.insert(membersTable).values({
      id: domainEntity.id,
      organizationId: domainEntity.organizationId,
      userId: domainEntity.userId,
      role: domainEntity.role,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    });
  }

  async update(domainEntity: Member): Promise<void> {
    await this.database
      .update(membersTable)
      .set({
        role: domainEntity.role,
        updatedAt: domainEntity.updatedAt,
      })
      .where(eq(membersTable.id, domainEntity.id));
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(membersTable).where(eq(membersTable.id, id));
  }

  async countAdmins(organizationId: string): Promise<number> {
    const result = await this.database
      .select({ value: count() })
      .from(membersTable)
      .where(
        and(
          eq(membersTable.organizationId, organizationId),
          eq(membersTable.role, 'admin')
        )
      );
    return result[0]?.value ?? 0;
  }
}
