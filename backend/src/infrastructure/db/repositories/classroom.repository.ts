import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { classroom, Classroom as DrizzleClassroom } from '../schema/classroom.schema';
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository';
import { Classroom } from '../../../domain/entities/classroom.entity';

export class ClassroomRepository implements IClassroomRepository {
  private mapToDomain(row: DrizzleClassroom): Classroom {
    return Classroom.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      capacity: row.capacity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Classroom | null> {
    const result = await db.select().from(classroom).where(eq(classroom.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Classroom[]> {
    const results = await db.select().from(classroom).where(eq(classroom.organizationId, organizationId));
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: Classroom): Promise<void> {
    const existing = await this.findById(domainEntity.id);
    
    if (existing) {
      await db.update(classroom)
        .set({
          name: domainEntity.name,
          capacity: domainEntity.capacity,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(classroom.id, domainEntity.id));
    } else {
      await db.insert(classroom).values({
        id: domainEntity.id,
        organizationId: domainEntity.organizationId,
        name: domainEntity.name,
        capacity: domainEntity.capacity,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(classroom).where(eq(classroom.id, id));
  }
}
