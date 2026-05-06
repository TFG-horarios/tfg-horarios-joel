import { eq } from 'drizzle-orm';
import { type DbConnection } from '../../../../core/db/connection';
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const results = await this.database.select().from(usersTable);
    return results.map((row) => this.mapToDomain(row));
  }

  async save(domainEntity: User): Promise<void> {
    const existing = await this.findById(domainEntity.id);

    if (existing) {
      await this.database
        .update(usersTable)
        .set({
          name: domainEntity.name,
          email: domainEntity.email,
        })
        .where(eq(usersTable.id, domainEntity.id));
    } else {
      await this.database.insert(usersTable).values({
        id: domainEntity.id,
        name: domainEntity.name,
        email: domainEntity.email,
        password: 'NO_PASSWORD_SET',
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(usersTable).where(eq(usersTable.id, id));
  }
}
