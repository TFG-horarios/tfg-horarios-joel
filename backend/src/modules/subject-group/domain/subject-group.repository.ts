import type { SubjectGroup } from './subject-group.entity';
import type {
  SubjectGroupIdentifierDTO,
  SubjectGroupListQueryDTO,
} from '@tfg-horarios/shared';

export interface GroupWithSubjectAndItinerary {
  id: string;
  subjectId: string;
  groupType: 'theory' | 'problems' | 'practices';
  shift: 'morning' | 'afternoon';
  groupNumber: number;
  weeklyHours: number;
  numberOfStudents: number;
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
    filters?: SubjectGroupListQueryDTO
  ): Promise<SubjectGroup[]>;
  findIdentifiers(organizationId: string): Promise<SubjectGroupIdentifierDTO[]>;
  findGroupsWithSubjectsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<GroupWithSubjectAndItinerary[]>;
  create(subjectGroup: SubjectGroup): Promise<void>;
  createMany(subjectGroups: SubjectGroup[]): Promise<void>;
  update(subjectGroup: SubjectGroup): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(subjectGroups: SubjectGroup[], organizationId: string): Promise<void>;
}
