import type { IMemberRepository } from '../domain/member.repository';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ROLES, type AppRole } from '@/core/permissions/roles';
import type { Member } from '../domain/member.entity';
import type { IMemberNotificationProvider } from '../domain/member-notification.provider';

export class EditMemberRoleUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly notificationProvider: IMemberNotificationProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    memberId: string,
    roleToUpdate: AppRole
  ): Promise<Member> {
    const member = await this.memberRepository.findById(
      memberId,
      organizationId
    );
    if (!member) {
      throw new NotFoundError('Member', memberId);
    }

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester || !hasPermission(requester.role, 'MANAGE_MEMBER')) {
      throw new ForbiddenError(
        'You cannot update the role of members in this organization. Only administrators can do it.'
      );
    }

    if (member.role === ROLES.ADMIN && roleToUpdate !== ROLES.ADMIN) {
      const adminCount =
        await this.memberRepository.countAdmins(organizationId);
      if (adminCount <= 1) {
        throw new ValidationError(
          'You cannot change the role of the last administrator in the organization. Please assign another member as administrator before changing this member role.'
        );
      }
    }

    member.updateRole(roleToUpdate, requesterUserId);
    await this.memberRepository.update(member);

    await this.notificationProvider.notifyRoleUpdated(
      member.userId,
      organizationId,
      roleToUpdate
    );

    return member;
  }
}
