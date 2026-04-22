import { ISubjectRepository } from '../../../domain/repositories/subject.repository';
import { Subject } from '../../../domain/entities/subject.entity';
import { CreateSubjectDTO, SubjectDTO } from '@tfg-horarios/shared';

export class CreateSubjectUseCase {
  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async execute(dto: CreateSubjectDTO): Promise<SubjectDTO> {
    const subject = Subject.create({
      organizationId: dto.organizationId,
      name: dto.name,
      code: dto.code,
      degree: dto.degree,
      availableShifts: dto.availableShifts,
      numberOfStudents: dto.numberOfStudents,
      courseYear: dto.courseYear,
      period: dto.period,
      weeklyHours: dto.weeklyHours,
      isCommon: dto.isCommon,
      itineraryName: dto.itineraryName,
    });

    await this.subjectRepository.save(subject);

    return {
      id: subject.id,
      organizationId: subject.organizationId,
      name: subject.name,
      code: subject.code,
      degree: subject.degree,
      availableShifts: subject.availableShifts,
      numberOfStudents: subject.numberOfStudents,
      courseYear: subject.courseYear,
      period: subject.period,
      weeklyHours: subject.weeklyHours,
      isCommon: subject.isCommon,
      itineraryName: subject.itineraryName,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    };
  }
}
