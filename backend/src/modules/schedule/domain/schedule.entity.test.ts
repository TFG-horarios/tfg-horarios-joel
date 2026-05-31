import { describe, expect, test } from 'bun:test';
import { Schedule } from './schedule.entity';

describe('Schedule', () => {
  const baseProps = {
    organizationId: 'org-1',
    degreeId: 'deg-1',
    academicYear: '2023-2024',
    shift: 'morning' as const,
    courseYear: 1,
    period: 1,
  };

  test('creates a schedule with defaults', () => {
    const schedule = Schedule.create(baseProps);
    expect(schedule.organizationId).toBe(baseProps.organizationId);
    expect(schedule.status).toBe('draft');
    expect(schedule.version).toBe('v1');
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
      version: 'v2',
      createdAt: date,
      updatedAt: date,
    };
    const schedule = Schedule.reconstitute(persistedProps);
    expect(schedule.id).toBe('sch-1');
    expect(schedule.status).toBe('published');
    expect(schedule.version).toBe('v2');
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

  test('archives a schedule and updates timestamp', () => {
    const schedule = Schedule.create(baseProps);
    const previousUpdatedAt = schedule.updatedAt;
    schedule.archive();
    expect(schedule.status).toBe('archived');
    expect(schedule.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });
});
