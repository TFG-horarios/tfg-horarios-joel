import { SubjectGroup } from '../domain/subject-group.entity';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';

export class SubjectGroupMapper {
  static toDTO(group: SubjectGroup): SubjectGroupDTO {
    return {
      id: group.id,
      organizationId: group.organizationId,
      subjectId: group.subjectId,
      name: group.name,
      groupType: group.groupType,
      shift: group.shift,
      groupNumber: group.groupNumber,
      weeklyHours: group.weeklyHours,
      numberOfStudents: group.numberOfStudents,
      needsComputerLab: group.needsComputerLab,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      deletedAt: group.deletedAt ? group.deletedAt.toISOString() : null,
    };
  }

  static toDTOList(groups: SubjectGroup[]): SubjectGroupDTO[] {
    return groups.map((g) => this.toDTO(g));
  }
}
