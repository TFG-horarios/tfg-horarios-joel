import { describe, expect, test } from 'bun:test';
import { ScheduleMapper } from './schedule.mapper';
import { Schedule } from '../domain/schedule.entity';

describe('ScheduleMapper', () => {
  const date = new Date();

  test('should map Schedule to ScheduleDTO', () => {
    const schedule = Schedule.reconstitute({
      id: 'sch-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: null,
      academicYear: '2023-2024',
      shift: 'morning',
      courseYear: 1,
      period: 1,
      status: 'draft',
      createdAt: date,
      updatedAt: date,
    });

    const dto = ScheduleMapper.toDTO(schedule);
    expect(dto).toEqual({
      id: 'sch-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: undefined,
      academicYear: '2023-2024',
      shift: 'morning',
      courseYear: 1,
      period: 1,
      status: 'draft',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });
});
