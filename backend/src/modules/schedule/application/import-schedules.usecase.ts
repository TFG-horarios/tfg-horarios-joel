import type {
  ImportSchedulesBodyDTO,
  ImportSchedulesResultDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IScheduleImportProvider } from '../domain/providers/schedule-import.provider';

export class ImportSchedulesUseCase {
  constructor(
    private readonly importProvider: IScheduleImportProvider,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesResultDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to import schedules in this organization.'
      );
    }

    return this.importProvider.importSchedules(organizationId, input);
  }
}
