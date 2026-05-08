import { Member } from './member.entity';

export interface MemberWithUserDetails {
  member: Member;
  userName: string;
  userEmail: string;
}

export interface IMemberRepository {
  findByUserAndOrg(
    userId: string,
    organizationId: string
  ): Promise<Member | null>;
  findByOrganizationId(
    organizationId: string
  ): Promise<MemberWithUserDetails[]>;
  create(member: Member): Promise<void>;
  update(member: Member): Promise<void>;
  delete(id: string): Promise<void>;
  countAdmins(organizationId: string): Promise<number>;
}
