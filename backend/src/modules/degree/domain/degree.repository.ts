import type { Degree } from './degree.entity';
import type { DegreeIdentifierDTO } from '@tfg-horarios/shared';

export interface IDegreeRepository {
  findById(id: string, organizationId: string): Promise<Degree | null>;
  findAll(organizationId: string): Promise<Degree[]>;
  findIdentifiers(organizationId: string): Promise<DegreeIdentifierDTO[]>;
  create(degree: Degree): Promise<void>;
  createMany(degrees: Degree[]): Promise<void>;
  update(degree: Degree): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(degrees: Degree[], organizationId: string): Promise<void>;
}
