import { eq } from 'drizzle-orm';
import { type DbConnection } from 'src/core/db/connection';
import { AuthUser } from '../../domain/auth.entity';
import type { AuthRepository } from 'src/modules/auth/domain/auth.repository';
import {
  usersTable,
  type DrizzleUser,
} from 'src/modules/user/infrastructure/db/drizzle.user.schema';

export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleUser): AuthUser {
    return AuthUser.reconstitute({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password,
    });
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async create(user: AuthUser): Promise<void> {
    await this.database.insert(usersTable).values({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.passwordHash,
    });
  }
}
