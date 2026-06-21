import { describe, expect, test } from 'bun:test';
import { CourseGroupOverlapRule } from './course-group-overlap.rule';
import type {
  MoveValidationContext,
  ValidationAssignment,
} from './move-validation';
import { ConflictError } from '@/core/errors/app.error';

describe('CourseGroupOverlapRule', () => {
  const rule = new CourseGroupOverlapRule();

  const createContext = (
    assignments: ValidationAssignment[],
    movingAssignment: ValidationAssignment,
    newDayOfWeek: number | null,
    newSlotIndex: number | null
  ): MoveValidationContext => ({
    organizationId: 'org-1',
    academicYearId: 'year-1',
    period: 1,
    shift: 'morning',
    assignments,
    classroomsCache: {},
    movingAssignment,
    newClassroomId: null,
    newDayOfWeek,
    newSlotIndex,
    maxMorningSlots: 6,
    maxSlotsPerDay: 12,
  });

  test('does not throw if no overlap', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'theory',
      subjectId: 's1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's2',
        dayOfWeek: 1,
        slotIndex: 3,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).not.toThrow();
  });

  test('throws ERR_OVERLAP_THEORY if overlaps with theory', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'theory',
      subjectId: 's1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's2',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_THEORY')
    );
  });

  test('throws ERR_OVERLAP_PRACTICES if overlaps with different practice types', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'seminar',
        subjectId: 's2',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_PRACTICES')
    );
  });

  test('throws ERR_OVERLAP_SAME_SUBJECT if overlaps with same subject', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_SAME_SUBJECT')
    );
  });
});
