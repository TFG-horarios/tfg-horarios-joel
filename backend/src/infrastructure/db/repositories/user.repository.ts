import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { user, User as DrizzleUser } from '../schema/user.schema';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';

export class UserRepository implements IUserRepository {
  private mapToDomain(row: DrizzleUser): User {
    return User.reconstitute({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const results = await db.select().from(user);
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: User): Promise<void> {
    const existing = await this.findById(domainEntity.id);
    
    if (existing) {
      await db.update(user)
        .set({
          name: domainEntity.name,
          email: domainEntity.email,
          password: domainEntity.password,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(user.id, domainEntity.id));
    } else {
      await db.insert(user).values({
        id: domainEntity.id,
        name: domainEntity.name,
        email: domainEntity.email,
        password: domainEntity.password as string,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(user).where(eq(user.id, id));
  }
}
