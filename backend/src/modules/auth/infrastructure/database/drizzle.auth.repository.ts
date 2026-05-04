import { eq } from 'drizzle-orm';
import { type DbConnection } from 'src/core/db/connection';
import { AuthUser } from '../../domain/auth.entity';
import type { AuthRepositoryInterface } from 'src/modules/auth/domain/auth.repository.interface';
import {
  usersTable,
  type DrizzleUser,
} from 'src/modules/user/infrastructure/database/drizzle.user.schema';

export class DrizzleAuthRepository implements AuthRepositoryInterface {
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
    const existing = await this.findByEmail(user.email);

    if (existing) {
      await this.database
        .update(usersTable)
        .set({
          name: user.name,
          email: user.email,
          password: user.passwordHash,
        })
        .where(eq(usersTable.id, user.id));
    } else {
      await this.database.insert(usersTable).values({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.passwordHash,
      });
    }
  }
}
