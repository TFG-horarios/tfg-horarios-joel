import type {
  ScheduleSlotDTO,
  SaveScheduleSlotDTO,
} from '@tfg-horarios/shared';
import type { IScheduleSlotRepository } from '../domain/schedule-slot.repository';
import type { IScheduleSlotMemberProvider } from '../domain/schedule-slot-member.provider';
import type { IScheduleSlotValidationProvider } from '../domain/schedule-slot-validation.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleSlotMapper } from './schedule-slot.mapper';

export class UpdateScheduleSlotUseCase {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly memberProvider: IScheduleSlotMemberProvider,
    private readonly validationProvider: IScheduleSlotValidationProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    slotId: string,
    dto: SaveScheduleSlotDTO
  ): Promise<ScheduleSlotDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update schedule slots in this organization.'
      );
    }

    const slot = await this.scheduleSlotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundError('ScheduleSlot', slotId);
    }

    const classroomId =
      dto.classroomId !== undefined ? dto.classroomId : slot.classroomId;
    const dayOfWeek =
      dto.dayOfWeek !== undefined ? dto.dayOfWeek : slot.dayOfWeek;
    const slotIndex =
      dto.slotIndex !== undefined ? dto.slotIndex : slot.slotIndex;

    await this.validationProvider.validateMove(
      organizationId,
      slot,
      classroomId,
      dayOfWeek,
      slotIndex
    );

    slot.assignLocationAndTime(classroomId, dayOfWeek, slotIndex);

    await this.scheduleSlotRepository.update(slot);
    return ScheduleSlotMapper.toDTO(slot);
  }
}
