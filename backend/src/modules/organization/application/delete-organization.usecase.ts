import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { type IOrganizationRepository } from '../domain/organization.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<void> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester || !hasPermission(requester.role, 'DELETE_ORGANIZATION')) {
      throw new ForbiddenError(
        'You can not delete this organization. Only administrators can do it.'
      );
    }

    await this.organizationRepository.delete(organizationId);
  }
}
