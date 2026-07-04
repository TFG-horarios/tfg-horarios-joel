import type {
  ImportSchedulesBodyDTO,
  ImportSchedulesOverwriteDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IScheduleImportProvider } from '../domain/providers/schedule-import.provider';

export class CheckImportSchedulesOverwriteUseCase {
  constructor(
    private readonly importProvider: IScheduleImportProvider,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesOverwriteDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to check schedule import overwrites in this organization.'
      );
    }

    return this.importProvider.checkOverwrite(organizationId, input);
  }
}
