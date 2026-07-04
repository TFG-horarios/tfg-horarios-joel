import type { IMemberRepository } from '../domain/member.repository';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ROLES } from '@/core/permissions/roles';
import type { Member } from '../domain/member.entity';
import type { INotificationProvider } from '../domain/providers/notification.provider';

export class RemoveMemberUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly notificationProvider: INotificationProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    memberId: string
  ): Promise<Member> {
    const member = await this.memberRepository.findById(
      memberId,
      organizationId
    );
    if (!member) {
      throw new NotFoundError('Member', memberId);
    }

    const isSelfRemoval = requesterUserId === member.userId;
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );

    if (
      !isSelfRemoval &&
      (!requester || !hasPermission(requester.role, 'MANAGE_MEMBER'))
    ) {
      throw new ForbiddenError(
        'You cannot remove members from this organization. Only administrators can do it.'
      );
    }

    if (member.role === ROLES.ADMIN) {
      const adminCount = await this.memberRepository.countAdmins(
        member.organizationId
      );
      if (adminCount <= 1) {
        throw new ValidationError(
          'Cannot remove the last administrator from the organization. Please assign another member as administrator before removing this one.'
        );
      }
    }

    await this.memberRepository.delete(member.id, member.organizationId);

    await this.notificationProvider.notifyRemovedFromOrganization(
      member.userId,
      member.organizationId
    );

    return member;
  }
}
