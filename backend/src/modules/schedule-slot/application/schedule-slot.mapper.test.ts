import { describe, expect, test } from 'bun:test';
import { ScheduleSlotMapper } from './schedule-slot.mapper';
import { ScheduleSlot } from '../domain/schedule-slot.entity';

describe('ScheduleSlotMapper', () => {
  const date = new Date();

  test('should map ScheduleSlot to ScheduleSlotDTO', () => {
    const slot = ScheduleSlot.reconstitute({
      id: 'slot-1',
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      duration: 2,
      conflicts: [],
      createdAt: date,
      updatedAt: date,
    });
    const dto = ScheduleSlotMapper.toDTO(slot);
    expect(dto).toEqual({
      id: 'slot-1',
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      duration: 2,
      conflicts: [],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });
});
