import { SubjectGroup } from './subject-group.entity';

export interface ISubjectGroupRepository {
  findById(id: string): Promise<SubjectGroup | null>;
  findAll(subjectId: string): Promise<SubjectGroup[]>;
  create(subjectGroup: SubjectGroup): Promise<void>;
  createMany(subjectGroups: SubjectGroup[]): Promise<void>;
  update(subjectGroup: SubjectGroup): Promise<void>;
  delete(id: string): Promise<void>;
}
