import type {
  ScheduleSlotDTO,
  SaveScheduleSlotDTO,
  ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
import type { IScheduleSlotRepository } from '../domain/schedule-slot.repository';
import type { IScheduleSlotDataProvider } from '../domain/schedule-slot-data.provider';
import type { IScheduleSlotMemberProvider } from '../domain/schedule-slot-member.provider';
import type { IScheduleSlotValidationProvider } from '../domain/schedule-slot-validation.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleSlotMapper } from './schedule-slot.mapper';
import {
  conflictCodeToType,
  ScheduleSlotConflictError,
} from '../domain/schedule-slot-conflict.error';
import type { IScheduleSlotUnitOfWork } from '../domain/schedule-slot-unit-of-work';
import type { ScheduleSlot } from '../domain/schedule-slot.entity';

export interface UpdateScheduleSlotResult {
  slot: ScheduleSlotDTO;
  affectedScheduleIds: string[];
}

export class UpdateScheduleSlotUseCase {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly dataProvider: IScheduleSlotDataProvider,
    private readonly memberProvider: IScheduleSlotMemberProvider,
    private readonly validationProvider: IScheduleSlotValidationProvider,
    private readonly unitOfWork?: IScheduleSlotUnitOfWork
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    slotId: string,
    dto: SaveScheduleSlotDTO
  ): Promise<UpdateScheduleSlotResult> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update schedule slots in this organization.'
      );
    }

    const update = (
      repository: IScheduleSlotRepository,
      dataProvider: IScheduleSlotDataProvider,
      validationProvider: IScheduleSlotValidationProvider
    ) =>
      this.executeUpdate(
        organizationId,
        slotId,
        dto,
        repository,
        dataProvider,
        validationProvider
      );

    if (this.unitOfWork) {
      return this.unitOfWork.run((dependencies) =>
        update(
          dependencies.repository,
          dependencies.dataProvider,
          dependencies.validationProvider
        )
      );
    }
    return update(
      this.scheduleSlotRepository,
      this.dataProvider,
      this.validationProvider
    );
  }

  private async executeUpdate(
    organizationId: string,
    slotId: string,
    dto: SaveScheduleSlotDTO,
    repository: IScheduleSlotRepository,
    dataProvider: IScheduleSlotDataProvider,
    validationProvider: IScheduleSlotValidationProvider
  ): Promise<UpdateScheduleSlotResult> {
    const slot = await repository.findById(slotId);
    if (!slot) {
      throw new NotFoundError('ScheduleSlot', slotId);
    }

    const classroomId =
      dto.classroomId !== undefined ? dto.classroomId : slot.classroomId;
    const dayOfWeek =
      dto.dayOfWeek !== undefined ? dto.dayOfWeek : slot.dayOfWeek;
    const slotIndex =
      dto.slotIndex !== undefined ? dto.slotIndex : slot.slotIndex;

    const scheduleContext = await dataProvider.getScheduleContext(
      slot.scheduleId,
      organizationId
    );
    if (!scheduleContext) {
      throw new NotFoundError('Schedule', slot.scheduleId);
    }

    const oldPlacement = {
      classroomId: slot.classroomId,
      dayOfWeek: slot.dayOfWeek,
      slotIndex: slot.slotIndex,
      duration: slot.duration,
    };

    const findRoomNeighbours = async (placement: typeof oldPlacement) => {
      if (
        placement.classroomId === null ||
        placement.dayOfWeek === null ||
        placement.slotIndex === null
      ) {
        return [];
      }
      const roomSlots =
        (await repository.findSlotsByClassroomIdAndFilters(
          placement.classroomId,
          organizationId,
          {
            academicYearId: scheduleContext.academicYearId,
            period: scheduleContext.period,
            shift: scheduleContext.shift,
          }
        )) ?? [];
      const start = placement.slotIndex;
      const end = start + Math.ceil(placement.duration) - 1;
      return roomSlots.filter((candidate) => {
        if (
          candidate.id === slot.id ||
          candidate.dayOfWeek !== placement.dayOfWeek ||
          candidate.slotIndex === null
        ) {
          return false;
        }
        const candidateEnd =
          candidate.slotIndex + Math.ceil(candidate.duration) - 1;
        return start <= candidateEnd && end >= candidate.slotIndex;
      });
    };

    const oldRoomNeighbours = await findRoomNeighbours(oldPlacement);

    const isCommon = await dataProvider.isGroupCommon(
      slot.subjectGroupId,
      slot.scheduleId,
      organizationId
    );

    let linkedSlots = [slot];

    if (isCommon) {
      const includedScheduleIds = await repository.findScheduleIdsIncludingSlot(
        slot.id
      );
      linkedSlots = [
        slot,
        ...includedScheduleIds.map((scheduleId) =>
          slot.asScheduleView(scheduleId, slot.scheduleId)
        ),
      ];
    }

    const isCompletePlacement =
      classroomId !== null && dayOfWeek !== null && slotIndex !== null;

    if (isCompletePlacement) {
      for (const linkedSlot of linkedSlots) {
        await validationProvider.validateMove(
          organizationId,
          linkedSlot,
          classroomId,
          dayOfWeek,
          slotIndex
        );
      }
    }

    slot.assignLocationAndTime(classroomId, dayOfWeek, slotIndex);
    await repository.update(slot);
    if (isCommon) {
      await repository.clearInclusionConflictsForSlot(slot.id);
    }

    if (classroomId !== null && dayOfWeek !== null && slotIndex !== null) {
      await dataProvider.rejectConflictingReservations(
        organizationId,
        scheduleContext.academicYearId,
        scheduleContext.period,
        classroomId,
        dayOfWeek,
        slotIndex,
        slot.duration
      );
    }

    if (!isCompletePlacement) {
      for (const linkedSlot of linkedSlots) {
        await dataProvider.unpublishSchedule(
          linkedSlot.scheduleId,
          organizationId
        );
      }
    }

    const newRoomNeighbours = await findRoomNeighbours({
      classroomId,
      dayOfWeek,
      slotIndex,
      duration: slot.duration,
    });
    const affectedScheduleIdsSet = new Set(
      linkedSlots.map((linkedSlot) => linkedSlot.scheduleId)
    );
    for (const neighbour of [...oldRoomNeighbours, ...newRoomNeighbours]) {
      affectedScheduleIdsSet.add(neighbour.scheduleId);
      const includedIds =
        (await repository.findScheduleIdsIncludingSlot(neighbour.id)) ?? [];
      includedIds.forEach((id) => affectedScheduleIdsSet.add(id));
    }
    const affectedScheduleIds = [...affectedScheduleIdsSet];
    let refreshedSlot: ScheduleSlot | null = null;

    for (const scheduleId of affectedScheduleIds) {
      const allSlots = await repository.findByScheduleId(scheduleId);

      for (const s of allSlots) {
        if (
          s.id === slot.id &&
          s.scheduleId === slot.scheduleId &&
          !s.isSharedCommon
        ) {
          refreshedSlot = s;
        }
        try {
          await validationProvider.validateMove(
            organizationId,
            s,
            s.classroomId,
            s.dayOfWeek,
            s.slotIndex
          );
          if (s.conflicts.length === 0) continue;
          s.updateConflicts([]);
          await repository.updateConflicts(s);
        } catch (err) {
          if (err instanceof Error && err.name.endsWith('ConflictError')) {
            const newConflicts: ScheduleConflictDetailDTO[] =
              err instanceof ScheduleSlotConflictError
                ? err.details
                : err.message.split('\n').flatMap((message) => {
                    const type = conflictCodeToType(message);
                    return type ? [{ type, message }] : [];
                  });
            if (newConflicts.length === 0) throw err;
            s.updateConflicts(newConflicts);
            await repository.updateConflicts(s);
          } else {
            throw err;
          }
        }
      }

      await dataProvider.updateScheduleConflictsAndUnassignedCount(
        scheduleId,
        organizationId
      );
    }

    if (!refreshedSlot) throw new NotFoundError('ScheduleSlot', slot.id);

    return {
      slot: ScheduleSlotMapper.toDTO(refreshedSlot),
      affectedScheduleIds,
    };
  }
}
