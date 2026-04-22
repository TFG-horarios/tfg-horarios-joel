import { ISubjectRepository } from '../../../domain/repositories/subject.repository';
import { SubjectDTO } from '@tfg-horarios/shared';

export class ListSubjectsUseCase {
  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async execute(organizationId: string): Promise<SubjectDTO[]> {
    const subjects = await this.subjectRepository.findByOrganizationId(organizationId);

    return subjects.map(sub => ({
      id: sub.id,
      organizationId: sub.organizationId,
      name: sub.name,
      code: sub.code,
      degree: sub.degree,
      availableShifts: sub.availableShifts,
      numberOfStudents: sub.numberOfStudents,
      courseYear: sub.courseYear,
      period: sub.period,
      weeklyHours: sub.weeklyHours,
      isCommon: sub.isCommon,
      itineraryName: sub.itineraryName,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));
  }
}
