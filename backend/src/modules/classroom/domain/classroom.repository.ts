import type { Classroom } from './classroom.entity';
import type { ClassroomIdentifierDTO } from '@tfg-horarios/shared';

export interface IClassroomRepository {
  findById(id: string, organizationId: string): Promise<Classroom | null>;
  findAll(organizationId: string): Promise<Classroom[]>;
  findIdentifiers(organizationId: string): Promise<ClassroomIdentifierDTO[]>;
  create(classroom: Classroom): Promise<void>;
  createMany(classrooms: Classroom[]): Promise<void>;
  update(classroom: Classroom): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(classrooms: Classroom[], organizationId: string): Promise<void>;
}
