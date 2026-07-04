import type { DbTransaction } from '@/core/db/transaction-runner';
import type { Classroom } from './classroom.entity';
import type {
  ClassroomIdentifierDTO,
  ClassroomListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface IClassroomRepository {
  findById(
    id: string,
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Classroom | null>;
  findAll(
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Classroom[]>;
  findPaginated(
    organizationId: string,
    filters?: ClassroomListQueryDTO
  ): Promise<PaginatedResponse<Classroom>>;
  findIdentifiers(organizationId: string): Promise<ClassroomIdentifierDTO[]>;
  create(classroom: Classroom): Promise<void>;
  createMany(classrooms: Classroom[]): Promise<void>;
  update(classroom: Classroom): Promise<void>;
  delete(id: string, organizationId: string, tx?: DbTransaction): Promise<void>;
  deleteAll(organizationId: string, tx?: DbTransaction): Promise<void>;
  replace(classrooms: Classroom[], organizationId: string): Promise<void>;
}
