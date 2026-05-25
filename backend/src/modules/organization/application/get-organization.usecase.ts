import { type IOrganizationRepository } from '../domain/organization.repository';
import { type OrganizationDTO } from '@tfg-horarios/shared';
import { OrganizationMapper } from './organization.mapper';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

export class GetOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(id: string, requesterUserId: string): Promise<OrganizationDTO> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundError('Organization', id);
    }
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      id
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization');
    }
    return OrganizationMapper.toDTO(organization);
  }
}
