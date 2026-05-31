import { describe, expect, test } from 'bun:test';
import { ScheduleSlot } from './schedule-slot.entity';

describe('ScheduleSlot', () => {
  const baseProps = {
    scheduleId: 'sch-1',
    subjectGroupId: 'sg-1',
    duration: 2,
  };

  test('creates a schedule slot with defaults', () => {
    const slot = ScheduleSlot.create(baseProps);
    expect(slot.scheduleId).toBe(baseProps.scheduleId);
    expect(slot.classroomId).toBeNull();
    expect(slot.dayOfWeek).toBeNull();
    expect(slot.slotIndex).toBeNull();
    expect(slot.duration).toBe(2);
    expect(slot.id).toBeString();
    expect(slot.createdAt).toBeInstanceOf(Date);
    expect(slot.updatedAt).toBeInstanceOf(Date);
  });

  test('creates a schedule slot with provided values', () => {
    const slot = ScheduleSlot.create({
      ...baseProps,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
    });
    expect(slot.classroomId).toBe('c-1');
    expect(slot.dayOfWeek).toBe(1);
    expect(slot.slotIndex).toBe(0);
  });

  test('reconstitutes a schedule slot from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      ...baseProps,
      id: 'slot-1',
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      createdAt: date,
      updatedAt: date,
    };
    const slot = ScheduleSlot.reconstitute(persistedProps);
    expect(slot.id).toBe('slot-1');
    expect(slot.classroomId).toBe('c-1');
  });

  test('assigns location and time and updates timestamp', () => {
    const slot = ScheduleSlot.create(baseProps);
    const previousUpdatedAt = slot.updatedAt;
    slot.assignLocationAndTime('c-1', 1, 0);
    expect(slot.classroomId).toBe('c-1');
    expect(slot.dayOfWeek).toBe(1);
    expect(slot.slotIndex).toBe(0);
    expect(slot.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });
});
