import { describe, expect, test } from 'bun:test';
import { RoomTypeRule } from './room-type.rule';
import type { MoveValidationContext } from './move-validation';

describe('RoomTypeRule', () => {
  test('rejects moving a computer group to a regular room', () => {
    const context = {
      movingAssignment: { needsComputerLab: true },
      newClassroomId: 'room-1',
      classroomsCache: { 'room-1': { capacity: 30, type: 'theory' } },
    } as unknown as MoveValidationContext;

    expect(() => new RoomTypeRule().validate(context)).toThrow(
      'ERR_COMPUTER_LAB_REQUIRED'
    );
  });
});
