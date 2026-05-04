import { Organization } from './organization.entity';

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findAll(): Promise<Organization[]>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
