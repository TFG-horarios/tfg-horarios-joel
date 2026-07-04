import type {
  SaveScheduleTimeConfigBodyDTO,
  ScheduleTimeConfigDTO,
} from '@tfg-horarios/shared';
import { ConflictError, ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';
import type { IScheduleTimeConfigMemberProvider } from '../domain/providers/schedule-time-config-member.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';
import {
  normalizeCreateScheduleTimeConfigInput,
  type NormalizedScheduleTimeConfigCreateInput,
} from './schedule-time-config-input';
import { ScheduleTimeConfigGridValidator } from './schedule-time-config-grid.validator';
import { toScheduleTimeConfigDTO } from './schedule-time-config.mapper';

export class CreateScheduleTimeConfigUseCase {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly memberProvider: IScheduleTimeConfigMemberProvider,
    private readonly gridValidator: ScheduleTimeConfigGridValidator
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    userId: string,
    data: SaveScheduleTimeConfigBodyDTO
  ): Promise<ScheduleTimeConfigDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create schedule time configurations in this organization.'
      );
    }

    const normalizedData: NormalizedScheduleTimeConfigCreateInput =
      normalizeCreateScheduleTimeConfigInput(data);
    const scope = { organizationId, academicYearId, ...normalizedData };
    if (!(await this.repository.validateScope(scope))) {
      throw new ValidationError(
        'Invalid degree, itinerary, or academic year scope.'
      );
    }

    const sameScope = await this.repository.findAll(
      organizationId,
      academicYearId,
      {
        degreeId: normalizedData.degreeId,
        courseYear: normalizedData.courseYear,
        period: normalizedData.period,
        shift: normalizedData.shift,
      }
    );
    if (
      sameScope.some((item) => item.itineraryId === normalizedData.itineraryId)
    ) {
      throw new ConflictError(
        'A time configuration already exists for this scope.'
      );
    }

    await this.gridValidator.validate(
      organizationId,
      academicYearId,
      normalizedData
    );
    const config = ScheduleTimeConfig.create({
      organizationId,
      academicYearId,
      ...normalizedData,
    });
    await this.repository.save(config);
    return toScheduleTimeConfigDTO(config);
  }
}
