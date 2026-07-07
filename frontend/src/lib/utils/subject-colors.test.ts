import { describe, expect, it } from 'vitest';
import { getSubjectColorClasses, SUBJECT_COLORS } from './subject-colors';

describe('getSubjectColorClasses', () => {
  it('assigns colors from a sorted unique subject pool', () => {
    const pool = ['subject-c', 'subject-a', 'subject-a', 'subject-b'];

    expect(getSubjectColorClasses('subject-a', pool)).toBe(SUBJECT_COLORS[0]);
    expect(getSubjectColorClasses('subject-b', pool)).toBe(SUBJECT_COLORS[1]);
    expect(getSubjectColorClasses('subject-c', pool)).toBe(SUBJECT_COLORS[2]);
  });

  it('falls back to a stable hash when the subject is outside the pool', () => {
    const firstColor = getSubjectColorClasses('external-subject', ['known']);
    const secondColor = getSubjectColorClasses('external-subject');

    expect(firstColor).toBe(secondColor);
    expect(SUBJECT_COLORS).toContain(firstColor);
  });
});
