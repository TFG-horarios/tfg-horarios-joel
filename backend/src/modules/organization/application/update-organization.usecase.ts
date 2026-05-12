import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { type IOrganizationRepository } from '../domain/organization.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { hasPermission } from '@/core/permissions/authorization';
import { OrganizationMapper } from './organization.mapper';
import {
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';

export class UpdateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveOrganizationDTO
  ): Promise<OrganizationDTO> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester || !hasPermission(requester.role, 'UPDATE_ORGANIZATION')) {
      throw new ForbiddenError(
        'You do not have permission to update this organization'
      );
    }

    org.update({
      name: dto.name,
      periodType: dto.periodType,
      morningStart: dto.morningStart,
      morningEnd: dto.morningEnd,
      afternoonStart: dto.afternoonStart,
      afternoonEnd: dto.afternoonEnd,
      slotDurationMinutes: dto.slotDurationMinutes,
    });

    await this.organizationRepository.update(org);
    return OrganizationMapper.toDTO(org);
  }
}
