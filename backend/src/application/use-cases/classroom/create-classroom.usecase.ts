import { IClassroomRepository } from '../../../domain/repositories/classroom.repository';
import { Classroom } from '../../../domain/entities/classroom.entity';
import { CreateClassroomDTO, ClassroomDTO } from '@tfg-horarios/shared';

export class CreateClassroomUseCase {
  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(dto: CreateClassroomDTO): Promise<ClassroomDTO> {
    const classroom = Classroom.create({
      organizationId: dto.organizationId,
      name: dto.name,
      capacity: dto.capacity,
    });

    await this.classroomRepository.save(classroom);

    return {
      id: classroom.id,
      organizationId: classroom.organizationId,
      name: classroom.name,
      capacity: classroom.capacity,
      createdAt: classroom.createdAt.toISOString(),
      updatedAt: classroom.updatedAt.toISOString(),
    };
  }
}
