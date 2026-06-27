import { AcademicYear } from './academic-year.entity';

export interface IAcademicYearRepository {
  save(academicYear: AcademicYear): Promise<void>;
  update(academicYear: AcademicYear, tx?: any): Promise<void>;
  findById(id: string): Promise<AcademicYear | null>;
  findByOrganizationId(organizationId: string): Promise<AcademicYear[]>;
  findActiveByOrganizationId(
    organizationId: string
  ): Promise<AcademicYear | null>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
  isHistoric?(id: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}
