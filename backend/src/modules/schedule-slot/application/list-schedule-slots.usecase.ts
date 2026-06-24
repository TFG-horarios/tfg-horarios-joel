import type { ScheduleSlotDTO } from '@tfg-horarios/shared';
import type { IScheduleSlotRepository } from '../domain/schedule-slot.repository';
import type { IScheduleSlotMemberProvider } from '../domain/providers/schedule-slot-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ScheduleSlotMapper } from './schedule-slot.mapper';

export class ListScheduleSlotsUseCase {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly memberProvider: IScheduleSlotMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    scheduleId: string
  ): Promise<ScheduleSlotDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const slots =
      await this.scheduleSlotRepository.findByScheduleId(scheduleId);
    return slots.map(ScheduleSlotMapper.toDTO);
  }
}
