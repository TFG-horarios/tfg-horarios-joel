import type { Member } from '@/modules/member/domain/member.entity';
import { Organization } from './organization.entity';

export interface IOrganizationRepository {
  findByUserId(userId: string): Promise<Organization[]>;
  findById(id: string): Promise<Organization | null>;
  create(organization: Organization, adminMember: Member): Promise<void>;
  delete(id: string): Promise<void>;
  update(organization: Organization): Promise<void>;
}
