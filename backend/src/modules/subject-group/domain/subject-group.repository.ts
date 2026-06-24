import type { SubjectGroup } from './subject-group.entity';
import type {
  GroupType,
  Shift,
  SubjectGroupIdentifierDTO,
  SubjectGroupListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface GroupWithSubjectAndItinerary {
  id: string;
  subjectId: string;
  groupType: GroupType;
  shift: Shift;
  groupNumber: number;
  weeklyHours: number;
  numberOfStudents: number;
  needsComputerLab: boolean;
  isCommon: boolean;
  itineraryName: string | null;
  itineraryId: string | null;
  degreeId: string;
  courseYear: number;
}

export interface ISubjectGroupRepository {
  findById(id: string, organizationId: string): Promise<SubjectGroup | null>;
  findAll(
    organizationId: string,
    includeDeleted: boolean
  ): Promise<SubjectGroup[]>;
  findPaginated(
    organizationId: string,
    filters?: SubjectGroupListQueryDTO
  ): Promise<PaginatedResponse<SubjectGroup>>;
  findIdentifiers(organizationId: string): Promise<SubjectGroupIdentifierDTO[]>;
  findGroupsWithSubjectsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<GroupWithSubjectAndItinerary[]>;
  create(subjectGroup: SubjectGroup, tx?: any): Promise<void>;
  createMany(subjectGroups: SubjectGroup[], tx?: any): Promise<void>;
  update(subjectGroup: SubjectGroup): Promise<void>;
  delete(id: string, organizationId: string, tx?: any): Promise<void>;
  deleteAll(organizationId: string, tx?: any): Promise<void>;
  replace(
    subjectGroups: SubjectGroup[],
    organizationId: string,
    tx?: any
  ): Promise<void>;
}
