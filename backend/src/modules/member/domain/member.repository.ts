import { Member } from './member.entity';
import type {
  MemberListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface MemberWithUserDetails {
  member: Member;
  userName: string;
  userEmail: string;
}

export interface IMemberRepository {
  findById(id: string, organizationId: string): Promise<Member | null>;
  findByUserAndOrg(
    userId: string,
    organizationId: string
  ): Promise<Member | null>;
  findByOrganizationId(
    organizationId: string
  ): Promise<MemberWithUserDetails[]>;
  findPaginated(
    organizationId: string,
    filters?: MemberListQueryDTO
  ): Promise<PaginatedResponse<MemberWithUserDetails>>;
  create(member: Member): Promise<void>;
  update(member: Member): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  countAdmins(organizationId: string): Promise<number>;
}
