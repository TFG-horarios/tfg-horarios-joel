import { Classroom } from '../domain/classroom.entity';
import { type ClassroomDTO } from '@tfg-horarios/shared';

export class ClassroomMapper {
  static toDTO(classroom: Classroom): ClassroomDTO {
    return {
      id: classroom.id,
      organizationId: classroom.organizationId,
      name: classroom.name,
      capacity: classroom.capacity,
      type: classroom.type,
      createdAt: classroom.createdAt.toISOString(),
      updatedAt: classroom.updatedAt.toISOString(),
      deletedAt: classroom.deletedAt ? classroom.deletedAt.toISOString() : null,
    };
  }

  static toDTOList(classrooms: Classroom[]): ClassroomDTO[] {
    return classrooms.map((classroom) => this.toDTO(classroom));
  }
}
