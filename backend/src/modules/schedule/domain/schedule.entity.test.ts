import { describe, expect, test } from 'bun:test';
import { Schedule } from './schedule.entity';

describe('Schedule', () => {
  const baseProps = {
    organizationId: 'org-1',
    degreeId: 'deg-1',
    academicYearId: 'ay-1',
    shift: 'morning' as const,
    courseYear: 1,
    period: 1,
  };

  test('creates a schedule with defaults', () => {
    const schedule = Schedule.create(baseProps);
    expect(schedule.organizationId).toBe(baseProps.organizationId);
    expect(schedule.status).toBe('draft');
    expect(schedule.id).toBeString();
    expect(schedule.createdAt).toBeInstanceOf(Date);
    expect(schedule.updatedAt).toBeInstanceOf(Date);
  });

  test('reconstitutes a schedule from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      ...baseProps,
      id: 'sch-1',
      status: 'published' as const,
      createdAt: date,
      updatedAt: date,
    };
    const schedule = Schedule.reconstitute(persistedProps);
    expect(schedule.id).toBe('sch-1');
    expect(schedule.status).toBe('published');
  });

  test('publishes a schedule and updates timestamp', () => {
    const schedule = Schedule.create(baseProps);
    const previousUpdatedAt = schedule.updatedAt;
    schedule.publish();
    expect(schedule.status).toBe('published');
    expect(schedule.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('marks a schedule as draft and updates timestamp', () => {
    const schedule = Schedule.create(baseProps);
    schedule.publish();
    const previousUpdatedAt = schedule.updatedAt;
    schedule.markAsDraft();
    expect(schedule.status).toBe('draft');
    expect(schedule.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });
});
