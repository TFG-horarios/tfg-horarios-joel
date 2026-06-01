import { Degree } from './degree.entity';

export interface IDegreeRepository {
  findById(id: string, organizationId: string): Promise<Degree | null>;
  findAll(organizationId: string): Promise<Degree[]>;
  create(degree: Degree): Promise<void>;
  createMany(degrees: Degree[]): Promise<void>;
  update(degree: Degree): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(degrees: Degree[], organizationId: string): Promise<void>;
}
