import { eq, and, count, ilike, type SQL } from 'drizzle-orm';
import { type DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  membersTable,
  type DrizzleMember,
  type NewDrizzleMember,
} from './drizzle.member.schema';
import {
  type IMemberRepository,
  type MemberWithUserDetails,
} from '../../domain/member.repository';
import { Member } from '../../domain/member.entity';
import { type AppRole } from '@/core/permissions/roles';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';
import type { MemberListQueryDTO } from '@tfg-horarios/shared';

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

  private mapToPersistence(domain: Member): NewDrizzleMember {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      userId: domain.userId,
      role: domain.role,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  async findById(id: string, organizationId: string): Promise<Member | null> {
    const result = await this.database
      .select()
      .from(membersTable)
      .where(
        and(
          eq(membersTable.id, id),
          eq(membersTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
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
    organizationId: string,
    filters?: MemberListQueryDTO
  ): Promise<MemberWithUserDetails[]> {
    const conditions: SQL[] = [eq(membersTable.organizationId, organizationId)];

    if (filters?.name) {
      conditions.push(ilike(usersTable.name, `%${filters.name}%`));
    }
    if (filters?.email) {
      conditions.push(ilike(usersTable.email, `%${filters.email}%`));
    }
    if (filters?.role) {
      conditions.push(eq(membersTable.role, filters.role));
    }

    const results = await this.database
      .select({
        member: membersTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(membersTable)
      .innerJoin(usersTable, eq(membersTable.userId, usersTable.id))
      .where(and(...conditions));
    return results.map((row) => ({
      member: this.mapToDomain(row.member),
      userName: row.userName,
      userEmail: row.userEmail,
    }));
  }

  async create(domainEntity: Member): Promise<void> {
    try {
      await this.database
        .insert(membersTable)
        .values(this.mapToPersistence(domainEntity));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError('El usuario ya pertenece a esta organización');
      }
      throw error;
    }
  }

  async update(domainEntity: Member): Promise<void> {
    const rawData = this.mapToPersistence(domainEntity);
    try {
      await this.database
        .update(membersTable)
        .set({
          role: rawData.role,
          updatedAt: rawData.updatedAt,
        })
        .where(
          and(
            eq(membersTable.id, domainEntity.id),
            eq(membersTable.organizationId, domainEntity.organizationId)
          )
        );
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError('El usuario ya pertenece a esta organización');
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .delete(membersTable)
      .where(
        and(
          eq(membersTable.id, id),
          eq(membersTable.organizationId, organizationId)
        )
      );
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
