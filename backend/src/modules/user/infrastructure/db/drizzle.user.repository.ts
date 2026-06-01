import { eq } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import { usersTable, type DrizzleUser } from './drizzle.user.schema';
import { type IUserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleUser): User {
    return User.reconstitute({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(usersTable).where(eq(usersTable.id, id));
  }

  async create(user: User): Promise<void> {
    try {
      await this.database.insert(usersTable).values({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError('A user with this email already exists.');
      }
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.database
        .update(usersTable)
        .set({
          name: user.name,
        })
        .where(eq(usersTable.id, user.id));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError('A user with this email already exists.');
      }
      throw error;
    }
  }
}
