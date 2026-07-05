import { describe, expect, test } from 'bun:test';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';
import { toScheduleTimeConfigDTO } from './schedule-time-config.mapper';

describe('ScheduleTimeConfigMapper', () => {
  test('should map ScheduleTimeConfig to DTO correctly', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const config = ScheduleTimeConfig.reconstitute({
      id: 'stc-1',
      organizationId: 'org-1',
      academicYearId: 'ay-1',
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
      createdAt: date,
      updatedAt: date,
    });

    const dto = toScheduleTimeConfigDTO(config);

    expect(dto).toEqual({
      id: 'stc-1',
      organizationId: 'org-1',
      academicYearId: 'ay-1',
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });
});
