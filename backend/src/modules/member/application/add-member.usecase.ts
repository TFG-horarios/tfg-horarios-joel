import type { GetUserByEmailUseCase } from '@/modules/user/application/get-by-email.usecase';
import type { IMemberRepository } from '../domain/member.repository';
import type { MemberDTO as MemberDTO } from '@tfg-horarios/shared';
import { type AppRole } from '@/core/permissions/roles';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { Member } from '../domain/member.entity';
import { MemberMapper } from './member.mapper';
import { hasPermission } from '@/core/permissions/authorization';

export class AddMemberUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    email: string,
    roleToAssign: AppRole
  ): Promise<MemberDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester || !hasPermission(requester.role, 'ADD_MEMBER')) {
      throw new ForbiddenError(
        'You cannot add members to this organization. Only administrators can do it.'
      );
    }

    const userToAdd = await this.getUserByEmailUseCase.execute(email);
    if (!userToAdd) {
      throw new NotFoundError('Usuario', email);
    }

    const existingMember = await this.memberRepository.findByUserAndOrg(
      userToAdd.id,
      organizationId
    );
    if (existingMember) {
      throw new ValidationError(
        'User is already a member of this organization'
      );
    }

    const newMember = Member.create({
      organizationId,
      userId: userToAdd.id,
      role: roleToAssign,
    });

    await this.memberRepository.create(newMember);

    return MemberMapper.toDTO(newMember, userToAdd.name, userToAdd.email);
  }
}
