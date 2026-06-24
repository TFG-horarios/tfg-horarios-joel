import type { Subject } from './subject.entity';
import type {
  SubjectIdentifierDTO,
  SubjectListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface ISubjectRepository {
  findById(id: string, organizationId: string): Promise<Subject | null>;
  findAll(
    organizationId: string,
    includeSoftDelete: boolean
  ): Promise<Subject[]>;
  findPaginated(
    organizationId: string,
    filters?: SubjectListQueryDTO
  ): Promise<PaginatedResponse<Subject>>;
  findIdentifiers(organizationId: string): Promise<SubjectIdentifierDTO[]>;
  create(subject: Subject): Promise<void>;
  createMany(subjects: Subject[]): Promise<void>;
  update(subject: Subject): Promise<void>;
  delete(id: string, organizationId: string, tx?: any): Promise<void>;
  deleteAll(organizationId: string, tx?: any): Promise<void>;
  replace(subjects: Subject[], organizationId: string): Promise<void>;
}
