import type { IScheduleSlotValidationProvider } from '../../domain/providers/schedule-slot-validation.provider';
import type { ScheduleSlot } from '../../domain/schedule-slot.entity';
import type { IScheduleSlotRepository } from '../../domain/schedule-slot.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleDataProvider } from '@/modules/schedule/domain/providers/schedule-data.provider';
import { NotFoundError } from '@/core/errors/app.error';
import type {
  Assignment,
  ClassroomMap,
} from '@/modules/scheduler/domain/types';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from '../../domain/rules/move-validation';
import { RoomCapacityRule } from '../../domain/rules/room-capacity.rule';
import { ShiftRule } from '../../domain/rules/shift.rule';
import { CourseGroupOverlapRule } from '../../domain/rules/course-group-overlap.rule';
import { RoomOverlapRule } from '../../domain/rules/room-overlap.rule';
import { UnassignedDiagnosticRule } from '../../domain/rules/unassigned-diagnostic.rule';
import { RoomTypeRule } from '../../domain/rules/room-type.rule';
import {
  conflictCodeToType,
  ScheduleSlotConflictError,
} from '../../domain/schedule-slot-conflict.error';
import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';

export class ScheduleSlotValidationAdapter implements IScheduleSlotValidationProvider {
  private readonly rules: IMoveValidationRule[];

  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly scheduleRepository: IScheduleRepository,
    private readonly dataProvider: IScheduleDataProvider
  ) {
    this.rules = [
      new RoomCapacityRule(),
      new RoomTypeRule(),
      new ShiftRule(),
      new CourseGroupOverlapRule(),
      new RoomOverlapRule(this.scheduleSlotRepository),
      new UnassignedDiagnosticRule(),
    ];
  }

  async validateMove(
    organizationId: string,
    slot: ScheduleSlot,
    newClassroomId: string | null,
    newDayOfWeek: number | null,
    newSlotIndex: number | null
  ): Promise<void> {
    const schedule = await this.scheduleRepository.findById(
      slot.scheduleId,
      organizationId
    );
    if (!schedule) throw new NotFoundError('Schedule', slot.scheduleId);

    const scheduleSlots = await this.scheduleSlotRepository.findByScheduleId(
      schedule.id
    );

    const groupsData = await this.dataProvider.getGroupsInScope(
      organizationId,
      schedule.period,
      [schedule.degreeId],
      schedule.itineraryId ? [schedule.itineraryId] : undefined,
      [schedule.courseYear]
    );

    const orgConstraints = await this.dataProvider.getAcademicYearConstraints(
      schedule.academicYearId
    );
    if (!orgConstraints)
      throw new NotFoundError(
        'AcademicYearConstraints',
        schedule.academicYearId
      );

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    const morningStart = parseTime(orgConstraints.morningStart);
    const morningEnd = parseTime(orgConstraints.morningEnd);
    const afternoonStart = parseTime(orgConstraints.afternoonStart);
    const afternoonEnd = parseTime(orgConstraints.afternoonEnd);
    const slotDuration = orgConstraints.slotDurationMinutes;

    const maxMorningSlots = Math.floor(
      (morningEnd - morningStart) / slotDuration
    );
    const maxAfternoonSlots = Math.floor(
      (afternoonEnd - afternoonStart) / slotDuration
    );
    const maxSlotsPerDay = maxMorningSlots + maxAfternoonSlots;

    const availableClassrooms =
      await this.dataProvider.getAvailableClassrooms(organizationId);
    const classroomsCache: ClassroomMap = {};
    for (const c of availableClassrooms) {
      classroomsCache[c.id] = {
        capacity: c.capacity,
        type: c.type,
        floor: c.floor,
      };
    }

    const assignments: Assignment[] = [];
    let movingAssignment: Assignment | null = null;

    for (const s of scheduleSlots) {
      const group = groupsData.find(
        (g) => g.subjectGroupId === s.subjectGroupId
      );
      if (!group) continue;

      const assignment: Assignment = {
        id: s.id,
        subjectGroupId: s.subjectGroupId,
        subjectId: group.subjectId,
        shift: schedule.shift,
        groupType: group.groupType,
        isCommon: group.isCommon,
        itineraryName: group.itineraryName ?? null,
        numberOfStudents: group.numberOfStudents,
        needsComputerLab: group.needsComputerLab,
        degreeId: schedule.degreeId,
        courseYear: schedule.courseYear,
        classroomId: s.classroomId,
        dayOfWeek: s.dayOfWeek,
        slotIndex: s.slotIndex,
        duration: s.duration,
      };

      assignments.push(assignment);
      if (s.id === slot.id) {
        movingAssignment = assignment;
      }
    }

    if (!movingAssignment) return;

    const context: MoveValidationContext = {
      organizationId,
      movingAssignment,
      newClassroomId,
      newDayOfWeek,
      newSlotIndex,
      assignments,
      classroomsCache,
      maxMorningSlots,
      maxSlotsPerDay,
      academicYearId: schedule.academicYearId,
      period: schedule.period,
      shift: schedule.shift,
    };

    const conflicts: ScheduleConflictDetailDTO[] = [];

    for (const rule of this.rules) {
      try {
        await rule.validate(context);
      } catch (err) {
        if (err instanceof ScheduleSlotConflictError) {
          conflicts.push(...err.details);
        } else if (err instanceof Error && err.name === 'ConflictError') {
          for (const message of err.message.split('\n')) {
            const type = conflictCodeToType(message);
            if (!type) throw err;
            conflicts.push({ type, message });
          }
        } else {
          throw err;
        }
      }
    }

    if (conflicts.length > 0) {
      throw new ScheduleSlotConflictError(conflicts);
    }
  }
}
