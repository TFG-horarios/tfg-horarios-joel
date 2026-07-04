import type {
  ScheduleTimeConfigDTO,
  UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { INotificationProvider } from '../domain/providers/notification.provider';
import type { IScheduleTimeConfigTimingChangeProvider } from '../domain/providers/schedule-time-config-timing-change.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';
import { normalizeUpdateScheduleTimeConfigInput } from './schedule-time-config-input';
import { ScheduleTimeConfigGridValidator } from './schedule-time-config-grid.validator';
import { toScheduleTimeConfigDTO } from './schedule-time-config.mapper';

export class UpdateScheduleTimeConfigUseCase {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly gridValidator: ScheduleTimeConfigGridValidator,
    private readonly timingChangeProvider?: IScheduleTimeConfigTimingChangeProvider,
    private readonly runInTransaction?: TransactionRunner,
    private readonly timingChangeNotifier?: INotificationProvider
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    id: string,
    userId: string,
    data: UpdateScheduleTimeConfigBodyDTO
  ): Promise<ScheduleTimeConfigDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update schedule time configurations in this organization.'
      );
    }

    const config = await this.repository.findById(id);
    if (
      !config ||
      config.organizationId !== organizationId ||
      config.academicYearId !== academicYearId
    ) {
      throw new NotFoundError('ScheduleTimeConfig', id);
    }

    const normalizedData = normalizeUpdateScheduleTimeConfigInput(data);
    await this.gridValidator.validate(organizationId, academicYearId, {
      ...normalizedData,
      degreeId: config.degreeId,
      courseYear: config.courseYear,
      period: config.period,
      shift: config.shift,
      itineraryId: config.itineraryId,
    });

    const timingChanged =
      config.startTime !== normalizedData.startTime ||
      config.endTime !== normalizedData.endTime ||
      config.hasBreak !== normalizedData.hasBreak ||
      config.breakAfterSlot !== normalizedData.breakAfterSlot;
    config.updateTiming(normalizedData);

    const invalidation =
      timingChanged && this.timingChangeProvider && this.runInTransaction
        ? await this.runInTransaction(async (tx) => {
            await this.repository.update(config, tx);
            return this.timingChangeProvider!.invalidateForTimingChange(
              organizationId,
              academicYearId,
              tx,
              id
            );
          })
        : undefined;

    if (!invalidation) await this.repository.update(config);
    if (invalidation) {
      await this.timingChangeNotifier?.notifyTimingChange(
        organizationId,
        invalidation
      );
    }
    return toScheduleTimeConfigDTO(config);
  }
}
