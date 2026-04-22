import { IClassroomRepository } from '../../../domain/repositories/classroom.repository';
import { ClassroomDTO } from '@tfg-horarios/shared';

export class ListClassroomsUseCase {
  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(organizationId: string): Promise<ClassroomDTO[]> {
    const classrooms =
      await this.classroomRepository.findByOrganizationId(organizationId);

    return classrooms.map((clr) => ({
      id: clr.id,
      organizationId: clr.organizationId,
      name: clr.name,
      capacity: clr.capacity,
      createdAt: clr.createdAt.toISOString(),
      updatedAt: clr.updatedAt.toISOString(),
    }));
  }
}
