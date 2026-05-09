import type { ClassroomDTO, CreateClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import { ClassroomMapper } from './classroom.mapper';

export class CreateClassroomUseCase {
  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(dto: CreateClassroomDTO): Promise<ClassroomDTO> {
    const classroom = Classroom.create({
      organizationId: dto.organizationId,
      name: dto.name,
      capacity: dto.capacity,
      type: dto.type,
    });

    await this.classroomRepository.create(classroom);
    return ClassroomMapper.toDTO(classroom);
  }
}
