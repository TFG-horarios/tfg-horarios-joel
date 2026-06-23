import { describe, expect, test } from 'bun:test';
import { RoomTypeConstraint } from './room-type.constraint';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment, ClassroomMap } from '../../types';

describe('RoomTypeConstraint', () => {
  const constraint = new RoomTypeConstraint();

  const createMockContext = (
    assignments: Assignment[],
    classroomsCache: ClassroomMap
  ): ConstraintContext => {
    return {
      assignments,
      classroomsCache,
      degreeGroups: new Map(),
      timeSlots: new Map(),
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    };
  };

  test('should return 0 penalty for practices in a lab', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: 'lab-1',
          groupType: 'practices',
        } as Assignment,
      ],
      {
        'lab-1': { type: 'lab', capacity: 30, floor: 1 },
      }
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return penalty for practices in a theory room', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: 'theory-1',
          groupType: 'practices',
        } as Assignment,
      ],
      {
        'theory-1': { type: 'theory', capacity: 30, floor: 1 },
      }
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(10);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return 0 penalty for theory in a theory room', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: 'theory-1',
          groupType: 'theory',
        } as Assignment,
      ],
      {
        'theory-1': { type: 'theory', capacity: 30, floor: 1 },
      }
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return penalty for theory in a lab room', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: 'lab-1',
          groupType: 'theory',
        } as Assignment,
      ],
      {
        'lab-1': { type: 'lab', capacity: 30, floor: 1 },
      }
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(10);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should accumulate penalties for multiple assignments', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: 'theory-1',
          groupType: 'practices',
        } as Assignment,
        {
          id: '2',
          classroomId: 'lab-1',
          groupType: 'theory',
        } as Assignment,
      ],
      {
        'theory-1': { type: 'theory', capacity: 30, floor: 1 },
        'lab-1': { type: 'lab', capacity: 30, floor: 2 },
      }
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(20);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return 0 penalty if classroomId is null or classroom not in cache', () => {
    const ctx = createMockContext(
      [
        {
          id: '1',
          classroomId: null,
          groupType: 'practices',
        } as Assignment,
        {
          id: '2',
          classroomId: 'unknown-room',
          groupType: 'theory',
        } as Assignment,
      ],
      {}
    );
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });
});
