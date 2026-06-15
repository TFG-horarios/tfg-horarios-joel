import type { IClassroomScheduleSlotProvider } from '../domain/classroom-schedule-slot.provider';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import type {
  ClassroomConfigurationListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';

export class GetActiveClassroomConfigurationsUseCase {
  constructor(
    private readonly scheduleSlotProvider: IClassroomScheduleSlotProvider,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYearId: string;
      shift: 'morning' | 'afternoon';
      period: number;
    }>
  > {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.scheduleSlotProvider.findActiveClassroomConfigurationsPaginated(
      organizationId,
      filters
    );
  }
}
