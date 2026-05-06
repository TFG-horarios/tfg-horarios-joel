import { Organization } from './organization.entity';

export interface IOrganizationRepository {
  findByUserId(userId: string): Promise<Organization[]>;
  findById(id: string): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
