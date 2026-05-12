import { Subject } from '../domain/subject.entity';
import type { SubjectDTO } from '@tfg-horarios/shared';

export class SubjectMapper {
  static toDTO(subject: Subject): SubjectDTO {
    return {
      id: subject.id,
      organizationId: subject.organizationId,
      degreeId: subject.degreeId,
      itineraryId: subject.itineraryId || undefined,
      name: subject.name,
      code: subject.code,
      availableShifts: subject.availableShifts,
      numberOfStudents: subject.numberOfStudents,
      courseYear: subject.courseYear,
      period: subject.period,
      weeklyHours: subject.weeklyHours,
      isCommon: subject.isCommon,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    };
  }

  static toDTOList(subjects: Subject[]): SubjectDTO[] {
    return subjects.map((subject) => this.toDTO(subject));
  }
}
