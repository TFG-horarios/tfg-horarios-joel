import { AcademicYear } from './academic-year.entity';

export interface IAcademicYearRepository {
  save(academicYear: AcademicYear): Promise<void>;
  update(academicYear: AcademicYear): Promise<void>;
  findById(id: string): Promise<AcademicYear | null>;
  findByOrganizationId(organizationId: string): Promise<AcademicYear[]>;
  findActiveByOrganizationId(
    organizationId: string
  ): Promise<AcademicYear | null>;
  delete(id: string): Promise<void>;
}
