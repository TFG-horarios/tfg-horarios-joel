import { Degree } from '../domain/degree.entity';
import type { DegreeDTO } from '@tfg-horarios/shared';

export class DegreeMapper {
  static toDTO(degree: Degree): DegreeDTO {
    return {
      id: degree.id,
      organizationId: degree.organizationId,
      name: degree.name,
      code: degree.code,
      createdAt: degree.createdAt.toISOString(),
      updatedAt: degree.updatedAt.toISOString(),
      deletedAt: degree.deletedAt ? degree.deletedAt.toISOString() : null,
    };
  }

  static toDTOList(degrees: Degree[]): DegreeDTO[] {
    return degrees.map((degree) => this.toDTO(degree));
  }
}
