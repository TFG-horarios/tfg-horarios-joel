import { Subject } from '../entities/subject.entity';

export interface ISubjectRepository {
  findById(id: string): Promise<Subject | null>;
  findByOrganizationId(organizationId: string): Promise<Subject[]>;
  save(subject: Subject): Promise<void>;
  delete(id: string): Promise<void>;
}
