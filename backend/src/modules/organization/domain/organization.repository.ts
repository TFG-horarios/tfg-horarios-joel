import { Organization } from './organization.entity';

export interface IOrganizationRepository {
  findByUserId(userId: string): Promise<Organization[]>;
  findById(id: string): Promise<Organization | null>;
  create(organization: Organization, adminUserId: string): Promise<void>;
  delete(id: string): Promise<void>;
  update(organization: Organization): Promise<void>;
}
