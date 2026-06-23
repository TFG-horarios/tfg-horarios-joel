import { describe, expect, it } from 'vitest';
import {
  conflictTranslationKeys,
  formatConflictMessage,
} from './conflict-message';

describe('formatConflictMessage', () => {
  it('shows the exact related group and classroom for a room overlap', () => {
    const translate = (
      key: string,
      values?: Record<string, string | number>
    ) => {
      if (key === 'conflictWith') return `Con: ${values?.subjects}`;
      if (key === 'conflictClassroom') return `Aula: ${values?.classroom}`;
      return key;
    };

    expect(
      formatConflictMessage(
        {
          type: 'ROOM_OVERLAP',
          relatedSubjectGroupIds: ['group-2'],
          classroomId: 'room-1',
        },
        30,
        translate,
        new Map([['group-2', 'Álgebra (theory 2)']]),
        new Map([['room-1', 'Aula 1.2']])
      )
    ).toBe('ERR_ROOM_OVERLAP Con: Álgebra (theory 2) Aula: Aula 1.2');
  });

  it('uses the duplicate-group reason for COURSE_OVERLAP', () => {
    expect(conflictTranslationKeys.COURSE_OVERLAP).toBe(
      'ERR_OVERLAP_DUPLICATE_GROUP'
    );
  });
});
