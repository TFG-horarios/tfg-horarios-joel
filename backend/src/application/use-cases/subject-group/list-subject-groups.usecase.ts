import { ISubjectGroupRepository } from '../../../domain/repositories/subject-group.repository';
import { SubjectGroupDTO } from '@tfg-horarios/shared';

export class ListSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository
  ) {}

  async execute(subjectId: string): Promise<SubjectGroupDTO[]> {
    const groups = await this.subjectGroupRepository.findBySubjectId(subjectId);

    return groups.map((group) => ({
      id: group.id,
      subjectId: group.subjectId,
      name: group.name,
      groupType: group.groupType,
      shift: group.shift,
      groupNumber: group.groupNumber,
      weeklyHours: group.weeklyHours,
      numberOfStudents: group.numberOfStudents,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    }));
  }
}
