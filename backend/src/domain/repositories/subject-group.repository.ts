import { SubjectGroup } from '../entities/subject-group.entity';

export interface ISubjectGroupRepository {
  findById(id: string): Promise<SubjectGroup | null>;
  findBySubjectId(subjectId: string): Promise<SubjectGroup[]>;
  save(subjectGroup: SubjectGroup): Promise<void>;
  delete(id: string): Promise<void>;
}
