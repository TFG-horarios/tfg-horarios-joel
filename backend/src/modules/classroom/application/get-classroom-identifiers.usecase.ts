import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { ClassroomIdentifierDTO } from '@tfg-horarios/shared';

export class GetClassroomIdentifiersUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<ClassroomIdentifierDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.classroomRepository.findIdentifiers(organizationId);
  }
}
