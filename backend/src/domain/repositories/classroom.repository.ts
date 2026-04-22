import { Classroom } from '../entities/classroom.entity';

export interface IClassroomRepository {
  findById(id: string): Promise<Classroom | null>;
  findByOrganizationId(organizationId: string): Promise<Classroom[]>;
  save(classroom: Classroom): Promise<void>;
  delete(id: string): Promise<void>;
}
