import type { Degree } from './degree.entity';
import type {
  DegreeIdentifierDTO,
  DegreeListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface IDegreeRepository {
  findById(
    id: string,
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Degree | null>;
  findAll(
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Degree[]>;
  findPaginated(
    organizationId: string,
    filters?: DegreeListQueryDTO
  ): Promise<PaginatedResponse<Degree>>;
  findIdentifiers(organizationId: string): Promise<DegreeIdentifierDTO[]>;
  create(degree: Degree): Promise<void>;
  createMany(degrees: Degree[]): Promise<void>;
  update(degree: Degree): Promise<void>;
  delete(id: string, organizationId: string, tx?: any): Promise<void>;
  deleteAll(organizationId: string, tx?: any): Promise<void>;
  replace(degrees: Degree[], organizationId: string): Promise<void>;
}
