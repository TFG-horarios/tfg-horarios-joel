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
      const includedScheduleIds =
        await this.scheduleSlotRepository.findScheduleIdsIncludingSlot(slot.id);
      linkedSlots = [
        slot,
        ...includedScheduleIds.map((scheduleId) =>
          slot.asScheduleView(scheduleId, slot.scheduleId)
        ),
      ];
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

    slot.assignLocationAndTime(classroomId, dayOfWeek, slotIndex);
    await this.scheduleSlotRepository.update(slot);
    if (isCommon) {
      await this.scheduleSlotRepository.clearInclusionConflictsForSlot(slot.id);
    }

    if (classroomId !== null && dayOfWeek !== null && slotIndex !== null) {
      await this.dataProvider.rejectConflictingReservations(
        organizationId,
        classroomId,
        dayOfWeek,
        slotIndex,
        slot.duration
      );
    }

    if (dayOfWeek === null || slotIndex === null) {
      for (const linkedSlot of linkedSlots) {
        await this.dataProvider.unpublishSchedule(
          linkedSlot.scheduleId,
          organizationId
        );
      }
    }

    const mapErrorToConflictType = (err: string): ScheduleConflictType => {
      switch (err) {
        case 'ERR_ROOM_CAPACITY':
          return 'ROOM_CAPACITY';
        case 'ERR_ROOM_OVERLAP':
          return 'ROOM_OVERLAP';
        case 'ERR_OVERLAP_COMMON_ITINERARY':
          return 'COURSE_OVERLAP_COMMON_ITINERARY';
        case 'ERR_OVERLAP_THEORY':
          return 'COURSE_OVERLAP_THEORY';
        case 'ERR_OVERLAP_SINGLE_GROUP':
          return 'COURSE_OVERLAP_SINGLE_GROUP';
        case 'ERR_OVERLAP_DIFFERENT_GROUP_TYPES':
          return 'COURSE_OVERLAP_DIFFERENT_GROUP_TYPES';
        case 'ERR_OVERLAP_SAME_SUBJECT':
          return 'COURSE_OVERLAP_SAME_SUBJECT';
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

    const affectedScheduleIds = [
      ...new Set(linkedSlots.map((linkedSlot) => linkedSlot.scheduleId)),
    ];

    for (const scheduleId of affectedScheduleIds) {
      const allSlots =
        await this.scheduleSlotRepository.findByScheduleId(scheduleId);

      for (const s of allSlots) {
        try {
          await this.validationProvider.validateMove(
            organizationId,
            s,
            s.classroomId,
            s.dayOfWeek,
            s.slotIndex
          );
          if (s.conflicts.length === 0) continue;
          s.updateConflicts([]);
          await this.scheduleSlotRepository.updateConflicts(s);
        } catch (err) {
          if (err instanceof Error && err.name === 'ConflictError') {
            const newConflicts = err.message.split('\n').map((msg) => ({
              type: mapErrorToConflictType(msg),
              message: msg,
            }));
            s.updateConflicts(newConflicts);
            await this.scheduleSlotRepository.updateConflicts(s);
          } else {
            throw err;
          }
        }
      }

      const refreshedSlots =
        await this.scheduleSlotRepository.findByScheduleId(scheduleId);
      const totalConflicts = refreshedSlots.reduce(
        (acc, s) => acc + s.conflicts.length,
        0
      );
      await this.dataProvider.updateScheduleConflictsCount(
        scheduleId,
        organizationId,
        totalConflicts
      );
    }

    return ScheduleSlotMapper.toDTO(slot);
  }
}
