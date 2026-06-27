import { describe, expect, test } from 'bun:test';
import { ComputerLabConstraint } from './computer-lab.constraint';
import { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

const assignment = (classroomId: string): Assignment => ({
  id: 'a-1',
  subjectGroupId: 'sg-1',
  subjectId: 's-1',
  shift: 'morning',
  groupType: 'practices',
  isCommon: true,
  itineraryName: null,
  numberOfStudents: 20,
  needsComputerLab: true,
  degreeId: 'd-1',
  courseYear: 1,
  classroomId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
});

describe('ComputerLabConstraint', () => {
  test('requires a computer lab when the group is marked accordingly', () => {
    const context = new ConstraintContext(
      [assignment('room-1')],
      { 'room-1': { capacity: 30, type: 'theory', floor: 0 } },
      {}
    );

    const result = new ComputerLabConstraint().calculatePenalty(context);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('ROOM_TYPE');
  });
});
