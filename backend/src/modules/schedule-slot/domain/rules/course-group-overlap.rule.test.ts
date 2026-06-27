import { describe, expect, test } from 'bun:test';
import type { AssignmentInterval } from '@tfg-horarios/shared';
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
  ): MoveValidationContext => {
    const projectIntervalForPlacement = (
      timeConfigId: string | null | undefined,
      slotIndex: number | null,
      duration: number
    ): AssignmentInterval | null => {
      if (slotIndex === null) return null;
      const start =
        timeConfigId === 'late-config'
          ? 8 * 60 + 30 + slotIndex * 60
          : 8 * 60 + slotIndex * 60;
      return { startMinutes: start, endMinutes: start + duration * 60 };
    };
    return {
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
      projectIntervalForPlacement,
    };
  };

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

  test('throws ERR_OVERLAP_SINGLE_GROUP if overlaps with single group', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
      subjectGroupId: 'sg1',
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
      new ConflictError('ERR_OVERLAP_SINGLE_GROUP')
    );
  });

  test('throws ERR_OVERLAP_DIFFERENT_GROUP_TYPES if overlaps with different practice types', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
      subjectGroupId: 'sg1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '1',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg1',
        dayOfWeek: 2,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '1b',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg1b',
        dayOfWeek: 2,
        slotIndex: 2,
      } as unknown as ValidationAssignment,
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'seminar',
        subjectId: 's2',
        subjectGroupId: 'sg2',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '2b',
        duration: 1,
        isCommon: true,
        groupType: 'seminar',
        subjectId: 's2',
        subjectGroupId: 'sg2b',
        dayOfWeek: 3,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_DIFFERENT_GROUP_TYPES')
    );
  });

  test('throws ERR_OVERLAP_SAME_SUBJECT if overlaps with same subject', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
      subjectGroupId: 'sg1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '1',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg1',
        dayOfWeek: 2,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '3',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg3',
        dayOfWeek: 3,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '2',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg2',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_SAME_SUBJECT')
    );
  });

  test('throws ERR_OVERLAP_COMMON_ITINERARY if common overlaps with itinerary', () => {
    const moving = {
      id: '1',
      duration: 1,
      isCommon: true,
      groupType: 'practice',
      subjectId: 's1',
      subjectGroupId: 'sg1',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '1',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg1',
        dayOfWeek: 2,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '1b',
        duration: 1,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's1',
        subjectGroupId: 'sg1b',
        dayOfWeek: 3,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '2',
        duration: 1,
        isCommon: false,
        itineraryName: 'Itinerary A',
        groupType: 'practice',
        subjectId: 's2',
        subjectGroupId: 'sg2',
        dayOfWeek: 1,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
      {
        id: '2b',
        duration: 1,
        isCommon: false,
        itineraryName: 'Itinerary A',
        groupType: 'practice',
        subjectId: 's2',
        subjectGroupId: 'sg2b',
        dayOfWeek: 4,
        slotIndex: 1,
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);
    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_OVERLAP_COMMON_ITINERARY')
    );
  });

  test('does not throw for same slotIndex when real minutes do not overlap', () => {
    const moving = {
      id: '1',
      duration: 0.5,
      isCommon: true,
      groupType: 'theory',
      subjectId: 's1',
      subjectGroupId: 'sg1',
      timeConfigId: 'early-config',
    } as unknown as ValidationAssignment;
    const assignments = [
      {
        id: '2',
        duration: 0.5,
        isCommon: true,
        groupType: 'practice',
        subjectId: 's2',
        subjectGroupId: 'sg2',
        dayOfWeek: 1,
        slotIndex: 1,
        timeConfigId: 'late-config',
      } as unknown as ValidationAssignment,
    ];
    const ctx = createContext(assignments, moving, 1, 1);

    expect(() => rule.validate(ctx)).not.toThrow();
  });
});
