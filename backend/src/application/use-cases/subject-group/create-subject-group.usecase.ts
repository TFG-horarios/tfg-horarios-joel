import { ISubjectGroupRepository } from '../../../domain/repositories/subject-group.repository';
import { SubjectGroup } from '../../../domain/entities/subject-group.entity';
import { CreateSubjectGroupDTO, SubjectGroupDTO } from '@tfg-horarios/shared';

export class CreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository
  ) {}

  async execute(dto: CreateSubjectGroupDTO): Promise<SubjectGroupDTO> {
    const subjectGroup = SubjectGroup.create({
      subjectId: dto.subjectId,
      name: dto.name,
      groupType: dto.groupType,
      shift: dto.shift,
      groupNumber: dto.groupNumber,
      weeklyHours: dto.weeklyHours,
      numberOfStudents: dto.numberOfStudents,
    });

    await this.subjectGroupRepository.save(subjectGroup);

    return {
      id: subjectGroup.id,
      subjectId: subjectGroup.subjectId,
      name: subjectGroup.name,
      groupType: subjectGroup.groupType,
      shift: subjectGroup.shift,
      groupNumber: subjectGroup.groupNumber,
      weeklyHours: subjectGroup.weeklyHours,
      numberOfStudents: subjectGroup.numberOfStudents,
      createdAt: subjectGroup.createdAt.toISOString(),
      updatedAt: subjectGroup.updatedAt.toISOString(),
    };
  }
}
