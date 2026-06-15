import type { IScheduleSlotValidationProvider } from '../../domain/schedule-slot-validation.provider';
import type { ScheduleSlot } from '../../domain/schedule-slot.entity';
import type { IScheduleSlotRepository } from '../../domain/schedule-slot.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleDataProvider } from '@/modules/schedule/domain/schedule-data.provider';
import { NotFoundError, ConflictError } from '@/core/errors/app.error';
import { PenaltyCalculator } from '@/modules/scheduler/domain/penalty-calculator';
import { CourseOverlapConstraint } from '@/modules/scheduler/domain/constraints/course-overlap.constraint';
import { RoomOverlapConstraint } from '@/modules/scheduler/domain/constraints/room-overlap.constraint';
import { RoomCapacityConstraint } from '@/modules/scheduler/domain/constraints/room-capacity.constraint';
import { ShiftConstraint } from '@/modules/scheduler/domain/constraints/shift.constraint';
import type {
  Assignment,
  ClassroomMap,
} from '@/modules/scheduler/domain/types';
import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';

export class ScheduleSlotValidationAdapter implements IScheduleSlotValidationProvider {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly scheduleRepository: IScheduleRepository,
    private readonly dataProvider: IScheduleDataProvider,
    private readonly reservationRepository: IClassroomReservationRepository
  ) {}

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
      classroomsCache[c.id] = { capacity: c.capacity, type: c.type };
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
        degreeId: schedule.degreeId,
        courseYear: schedule.courseYear,
        classroomId: s.classroomId,
        dayOfWeek: s.dayOfWeek,
        slotIndex:
          s.slotIndex !== null
            ? schedule.shift === 'afternoon'
              ? s.slotIndex + maxMorningSlots
              : s.slotIndex
            : null,
        duration: s.duration,
      };

      assignments.push(assignment);
      if (s.id === slot.id) {
        movingAssignment = assignment;
      }
    }

    if (!movingAssignment) return;

    const constraints = [
      new RoomOverlapConstraint(),
      new ShiftConstraint(),
      new RoomCapacityConstraint(),
      new CourseOverlapConstraint(),
    ];

    const penaltyCalculator = new PenaltyCalculator(
      constraints,
      classroomsCache,
      maxMorningSlots,
      maxSlotsPerDay
    );

    const oldPenalty = penaltyCalculator.calculatePenalty(assignments);

    movingAssignment.classroomId = newClassroomId;
    movingAssignment.dayOfWeek = newDayOfWeek;
    movingAssignment.slotIndex =
      newSlotIndex !== null
        ? schedule.shift === 'afternoon'
          ? newSlotIndex + maxMorningSlots
          : newSlotIndex
        : null;

    const newPenalty = penaltyCalculator.calculatePenalty(assignments);

    if (newPenalty > oldPenalty) {
      throw new ConflictError(
        'The move violates strong constraints (overlap or capacity).'
      );
    }

    if (
      newClassroomId !== null &&
      newDayOfWeek !== null &&
      newSlotIndex !== null
    ) {
      const hasReservation =
        await this.reservationRepository.hasAcceptedFutureReservation(
          organizationId,
          newClassroomId,
          newDayOfWeek,
          newSlotIndex
        );

      if (hasReservation) {
        throw new ConflictError(
          'El aula tiene una reserva aceptada para ese horario en el futuro.'
        );
      }
    }
  }
}
