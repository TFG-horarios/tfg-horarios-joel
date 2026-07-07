import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';
import { describe, expect, it } from 'vitest';
import {
  conflictTranslationKeys,
  formatConflictMessage,
} from './conflict-message';

describe('formatConflictMessage', () => {
  const translate = (
    key: string,
    values?: Record<string, string | number>
  ) => {
    if (!values) return key;

    return `${key}:${Object.values(values).join(',')}`;
  };

  it('returns the translated conflict type message', () => {
    const conflict = { type: 'ROOM_OVERLAP' } satisfies ScheduleConflictDetailDTO;

    expect(formatConflictMessage(conflict, 30, translate)).toBe(
      conflictTranslationKeys.ROOM_OVERLAP
    );
  });

  it('passes group capacity for unassigned room capacity conflicts', () => {
    const conflict = {
      type: 'UNASSIGNED_ROOM_CAPACITY',
    } satisfies ScheduleConflictDetailDTO;

    expect(formatConflictMessage(conflict, 42, translate)).toBe(
      `${conflictTranslationKeys.UNASSIGNED_ROOM_CAPACITY}:42`
    );
  });

  it('appends unique related subject labels and classroom labels', () => {
    const conflict = {
      type: 'COURSE_OVERLAP',
      relatedSubjectGroupIds: ['group-1', 'group-2', 'group-3'],
      classroomId: 'classroom-1',
    } satisfies ScheduleConflictDetailDTO;

    const message = formatConflictMessage(
      conflict,
      30,
      translate,
      new Map([
        ['group-1', 'Math theory'],
        ['group-2', 'Math theory'],
        ['group-3', 'Physics lab'],
      ]),
      new Map([['classroom-1', 'Lab 1']])
    );

    expect(message).toBe(
      `${conflictTranslationKeys.COURSE_OVERLAP} conflictWith:Math theory, Physics lab conflictClassroom:Lab 1`
    );
  });

  it('falls back to raw ids when labels are not provided', () => {
    const conflict = {
      type: 'ROOM_TYPE',
      relatedSubjectGroupIds: ['group-1'],
      classroomId: 'classroom-1',
    } satisfies ScheduleConflictDetailDTO;

    expect(formatConflictMessage(conflict, 30, translate)).toBe(
      `${conflictTranslationKeys.ROOM_TYPE} conflictWith:group-1 conflictClassroom:classroom-1`
    );
  });
});
