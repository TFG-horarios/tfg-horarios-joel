import { describe, expect, test } from 'bun:test';
import { RoomCapacityRule } from './room-capacity.rule';
import type { MoveValidationContext } from './move-validation';
import { ConflictError } from '@/core/errors/app.error';

describe('RoomCapacityRule', () => {
  const rule = new RoomCapacityRule();

  test('does not throw if capacity is sufficient', () => {
    const ctx = {
      newClassroomId: 'c-1',
      movingAssignment: { numberOfStudents: 20 },
      classroomsCache: { 'c-1': { capacity: 30 } },
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).not.toThrow();
  });

  test('throws ERR_ROOM_CAPACITY if capacity is insufficient', () => {
    const ctx = {
      newClassroomId: 'c-1',
      movingAssignment: { numberOfStudents: 40 },
      classroomsCache: { 'c-1': { capacity: 30 } },
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_ROOM_CAPACITY')
    );
  });

  test('does not throw if newClassroomId is null', () => {
    const ctx = {
      newClassroomId: null,
      movingAssignment: { numberOfStudents: 40 },
      classroomsCache: { 'c-1': { capacity: 30 } },
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).not.toThrow();
  });
});
