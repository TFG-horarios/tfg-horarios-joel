import type {
  ScheduleSlotDTO,
  SaveScheduleSlotDTO,
  ScheduleConflictType,
} from '@tfg-horarios/shared';
import type { IScheduleSlotRepository } from '../domain/schedule-slot.repository';
import type { IScheduleSlotDataProvider } from '../domain/schedule-slot-data.provider';
import type { IScheduleSlotMemberProvider } from '../domain/schedule-slot-member.provider';
import type { IScheduleSlotValidationProvider } from '../domain/schedule-slot-validation.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleSlotMapper } from './schedule-slot.mapper';

export class UpdateScheduleSlotUseCase {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly dataProvider: IScheduleSlotDataProvider,
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

    const scheduleContext = await this.dataProvider.getScheduleContext(
      slot.scheduleId,
      organizationId
    );
    if (!scheduleContext) {
      throw new NotFoundError('Schedule', slot.scheduleId);
    }

    const isCommon = await this.dataProvider.isGroupCommon(
      slot.subjectGroupId,
      slot.scheduleId,
      organizationId
    );

    let linkedSlots = [slot];

    if (isCommon) {
      linkedSlots = await this.scheduleSlotRepository.findLinkedSlots(
        slot.subjectGroupId,
        scheduleContext.academicYearId,
        scheduleContext.shift,
        slot.classroomId,
        slot.dayOfWeek,
        slot.slotIndex,
        slot.duration
      );
    }

    for (const linkedSlot of linkedSlots) {
      await this.validationProvider.validateMove(
        organizationId,
        linkedSlot,
        classroomId,
        dayOfWeek,
        slotIndex
      );
    }

    for (const linkedSlot of linkedSlots) {
      linkedSlot.assignLocationAndTime(classroomId, dayOfWeek, slotIndex);
      await this.scheduleSlotRepository.update(linkedSlot);

      if (classroomId !== null && dayOfWeek !== null && slotIndex !== null) {
        await this.dataProvider.rejectConflictingReservations(
          organizationId,
          classroomId,
          dayOfWeek,
          slotIndex,
          linkedSlot.duration
        );
      }
    }

    if (dayOfWeek === null || slotIndex === null) {
      await this.dataProvider.unpublishSchedule(
        slot.scheduleId,
        organizationId
      );
    }

    const allSlots = await this.scheduleSlotRepository.findByScheduleId(
      slot.scheduleId
    );

    const mapErrorToConflictType = (err: string): ScheduleConflictType => {
      switch (err) {
        case 'ERR_ROOM_CAPACITY':
          return 'ROOM_CAPACITY';
        case 'ERR_ROOM_OVERLAP':
          return 'ROOM_OVERLAP';
        case 'ERR_OVERLAP_SAME_SUBJECT':
          return 'COURSE_OVERLAP';
        case 'ERR_SHIFT_MORNING':
          return 'SHIFT_MORNING';
        case 'ERR_SHIFT_AFTERNOON':
          return 'SHIFT_AFTERNOON';
        case 'ERR_SHIFT_EXCEEDS_DAY':
          return 'SHIFT_EXCEEDS_DAY';
        default:
          return 'UNASSIGNED';
      }
    };

    for (const s of allSlots) {
      if (linkedSlots.some((ls) => ls.id === s.id)) continue;
      if (s.conflicts.length === 0) continue;

      try {
        await this.validationProvider.validateMove(
          organizationId,
          s,
          s.classroomId,
          s.dayOfWeek,
          s.slotIndex
        );
        s.updateConflicts([]);
        await this.scheduleSlotRepository.update(s);
      } catch (err) {
        if (err instanceof Error && err.name === 'ConflictError') {
          const newConflicts = err.message.split('\n').map((msg) => ({
            type: mapErrorToConflictType(msg),
            message: msg,
          }));
          s.updateConflicts(newConflicts);
          await this.scheduleSlotRepository.update(s);
        }
      }
    }

    return ScheduleSlotMapper.toDTO(slot);
  }
}
