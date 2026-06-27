import { describe, expect, test } from 'bun:test';
import {
  buildScheduleTimeGrid,
  crossesBreakBoundary,
  intervalsOverlap,
  projectAssignmentInterval,
} from './schedule-timeline';

const global = {
  slotDurationMinutes: 55,
  breakDurationMinutes: 30,
};

describe('schedule time grid', () => {
  test('builds the expected morning grid', () => {
    const grid = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    });
    expect(grid.slots.map((slot) => slot.label)).toEqual([
      '08:00 - 08:55',
      '08:55 - 09:50',
      '09:50 - 10:45',
      '11:15 - 12:10',
      '12:10 - 13:05',
      '13:05 - 14:00',
    ]);
    expect(grid.breaks.map((item) => item.label)).toEqual(['10:45 - 11:15']);
    expect(grid.breakBoundaries).toEqual([3]);
  });

  test('builds the expected afternoon grid with local indices', () => {
    const grid = buildScheduleTimeGrid(global, {
      startTime: '14:30',
      endTime: '20:30',
      hasBreak: true,
      breakAfterSlot: 3,
    });
    expect(grid.slots.map((slot) => slot.label)).toEqual([
      '14:30 - 15:25',
      '15:25 - 16:20',
      '16:20 - 17:15',
      '17:45 - 18:40',
      '18:40 - 19:35',
      '19:35 - 20:30',
    ]);
    expect(grid.slots.map((slot) => slot.slotIndex)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  test('projects sessions and rejects break crossings or overflow', () => {
    const grid = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    });
    expect(projectAssignmentInterval(grid, 1, 2)).toEqual({
      startMinutes: 535,
      endMinutes: 645,
    });
    expect(projectAssignmentInterval(grid, 2, 2)).toBeNull();
    expect(projectAssignmentInterval(grid, 5, 2)).toBeNull();
    expect(crossesBreakBoundary(2, 2, [3])).toBe(true);
  });

  test('does not add a break when disabled or duration is zero', () => {
    const disabled = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '10:45',
      hasBreak: false,
      breakAfterSlot: null,
    });
    const zeroDuration = buildScheduleTimeGrid(
      { slotDurationMinutes: 55, breakDurationMinutes: 0 },
      {
        startTime: '08:00',
        endTime: '10:45',
        hasBreak: true,
        breakAfterSlot: 1,
      }
    );

    expect(disabled.breaks).toEqual([]);
    expect(disabled.slots).toHaveLength(3);
    expect(zeroDuration.breaks).toEqual([]);
    expect(zeroDuration.slots).toHaveLength(3);
  });

  test('keeps exact final fits and rejects incomplete trailing slots', () => {
    const exact = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '09:50',
      hasBreak: false,
      breakAfterSlot: null,
    });
    const trailing = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '10:00',
      hasBreak: false,
      breakAfterSlot: null,
    });

    expect(exact.slots.map((slot) => slot.label)).toEqual([
      '08:00 - 08:55',
      '08:55 - 09:50',
    ]);
    expect(trailing.slots).toHaveLength(2);
  });

  test('skips configured break if it would leave no complete slot afterwards', () => {
    const grid = buildScheduleTimeGrid(global, {
      startTime: '08:00',
      endTime: '10:10',
      hasBreak: true,
      breakAfterSlot: 1,
    });

    expect(grid.breaks).toEqual([]);
    expect(grid.breakBoundaries).toEqual([]);
    expect(grid.slots).toHaveLength(2);
  });

  test('detects physical overlap by minute ranges', () => {
    expect(
      intervalsOverlap(
        { startMinutes: 9 * 60, endMinutes: 10 * 60 },
        { startMinutes: 9 * 60 + 30, endMinutes: 10 * 60 + 30 }
      )
    ).toBe(true);
    expect(
      intervalsOverlap(
        { startMinutes: 9 * 60, endMinutes: 10 * 60 },
        { startMinutes: 10 * 60, endMinutes: 11 * 60 }
      )
    ).toBe(false);
  });
});
