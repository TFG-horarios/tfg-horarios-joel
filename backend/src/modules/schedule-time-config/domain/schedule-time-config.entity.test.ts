import { describe, expect, test } from 'bun:test';
import { ScheduleTimeConfig } from './schedule-time-config.entity';

describe('ScheduleTimeConfig Entity', () => {
  const baseProps = {
    organizationId: 'org-1',
    academicYearId: 'ay-1',
    degreeId: 'deg-1',
    itineraryId: null,
    courseYear: 1,
    period: 1,
    shift: 'morning' as const,
    startTime: '08:00',
    endTime: '14:00',
    hasBreak: true,
    breakAfterSlot: 3,
  };

  test('creates a valid schedule time config successfully', () => {
    const config = ScheduleTimeConfig.create(baseProps);
    expect(config.id).toBeString();
    expect(config.organizationId).toBe('org-1');
    expect(config.startTime).toBe('08:00');
    expect(config.hasBreak).toBeTrue();
    expect(config.breakAfterSlot).toBe(3);
    expect(config.createdAt).toBeInstanceOf(Date);
  });

  test('creates a valid schedule time config without break', () => {
    const config = ScheduleTimeConfig.create({
      ...baseProps,
      hasBreak: false,
      breakAfterSlot: null,
    });
    expect(config.hasBreak).toBeFalse();
    expect(config.breakAfterSlot).toBeNull();
  });

  test('throws Error if endTime is not later than startTime', () => {
    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        startTime: '14:00',
        endTime: '13:00',
      })
    ).toThrow('endTime must be later than startTime.');

    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        startTime: '10:00',
        endTime: '10:00',
      })
    ).toThrow('endTime must be later than startTime.');
  });

  test('throws Error if break is enabled but breakAfterSlot is null', () => {
    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        hasBreak: true,
        breakAfterSlot: null,
      })
    ).toThrow('breakAfterSlot is required when break is enabled.');
  });

  test('throws Error if break is disabled but breakAfterSlot is not null', () => {
    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        hasBreak: false,
        breakAfterSlot: 3,
      })
    ).toThrow('breakAfterSlot must be null when break is disabled.');
  });

  test('throws Error if breakAfterSlot is not a positive integer', () => {
    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        hasBreak: true,
        breakAfterSlot: 0,
      })
    ).toThrow('breakAfterSlot must be a positive integer.');

    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        hasBreak: true,
        breakAfterSlot: -1,
      })
    ).toThrow('breakAfterSlot must be a positive integer.');

    expect(() =>
      ScheduleTimeConfig.create({
        ...baseProps,
        hasBreak: true,
        breakAfterSlot: 1.5,
      })
    ).toThrow('breakAfterSlot must be a positive integer.');
  });

  test('reconstitutes config from persisted props', () => {
    const date = new Date();
    const config = ScheduleTimeConfig.reconstitute({
      ...baseProps,
      id: 'stc-1',
      createdAt: date,
      updatedAt: date,
    });
    expect(config.id).toBe('stc-1');
    expect(config.createdAt).toBe(date);
    expect(config.updatedAt).toBe(date);
  });

  test('updates timing successfully', () => {
    const config = ScheduleTimeConfig.create(baseProps);

    config.updateTiming({
      startTime: '09:00',
      endTime: '15:00',
      hasBreak: false,
      breakAfterSlot: null,
    });

    expect(config.startTime).toBe('09:00');
    expect(config.endTime).toBe('15:00');
    expect(config.hasBreak).toBeFalse();
    expect(config.breakAfterSlot).toBeNull();
  });

  test('update throws Error if validation fails', () => {
    const config = ScheduleTimeConfig.create(baseProps);
    expect(() =>
      config.updateTiming({
        startTime: '15:00',
        endTime: '12:00',
        hasBreak: true,
        breakAfterSlot: 2,
      })
    ).toThrow('endTime must be later than startTime.');
  });
});
