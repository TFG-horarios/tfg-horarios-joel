import type { IScheduleSlotProvider } from '../domain/providers/schedule-slot.provider';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type {
  ClassroomConfigurationListQueryDTO,
  PaginatedResponse,
  Shift,
} from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';

export class GetActiveClassroomConfigurationsUseCase {
  constructor(
    private readonly scheduleSlotProvider: IScheduleSlotProvider,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYearId: string;
      shift: Shift;
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
