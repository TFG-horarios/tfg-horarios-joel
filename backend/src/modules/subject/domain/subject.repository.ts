import { Subject } from './subject.entity';

export interface ISubjectRepository {
  findById(id: string, organizationId: string): Promise<Subject | null>;
  findAll(organizationId: string): Promise<Subject[]>;
  create(subject: Subject): Promise<void>;
  createMany(subjects: Subject[]): Promise<void>;
  update(subject: Subject): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(subjects: Subject[], organizationId: string): Promise<void>;
}
