import { SubjectGroup } from './subject-group.entity';

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
  findAll(organizationId: string): Promise<SubjectGroup[]>;
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
}
