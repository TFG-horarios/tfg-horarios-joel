import { Member } from '../domain/member.entity';
import { type MemberDTO } from '@tfg-horarios/shared';
import type { MemberWithUserDetails } from '../domain/member.repository';

export class MemberMapper {
  static toDTO(
    member: Member,
    userName?: string,
    userEmail?: string
  ): MemberDTO {
    return {
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role,
      userName: userName || '',
      userEmail: userEmail || '',
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }

  static toDTOList(items: MemberWithUserDetails[]): MemberDTO[] {
    return items.map((item) =>
      this.toDTO(item.member, item.userName, item.userEmail)
    );
  }
}
