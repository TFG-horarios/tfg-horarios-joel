import { Classroom } from './classroom.entity';

export interface IClassroomRepository {
  findById(id: string): Promise<Classroom | null>;
  findAll(organizationId: string): Promise<Classroom[]>;
  create(classroom: Classroom): Promise<void>;
  createMany(classrooms: Classroom[]): Promise<void>;
  update(classroom: Classroom): Promise<void>;
  delete(id: string): Promise<void>;
}
