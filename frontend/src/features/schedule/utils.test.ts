import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ScheduleDTO,
  ScheduleSlotDTO,
  ScheduleTimeConfigDTO,
} from '@tfg-horarios/shared';
import {
  buildAcademicYear,
  buildClassroom,
  buildDegree,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { generateScheduleCsv } from './utils';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    return (key: string, values?: Record<string, string | number>) => {
      if (namespace === 'Organizations.schedules.planner') {
        const days: Record<string, string> = {
          'days.1': 'Monday',
          'days.2': 'Tuesday',
          'days.3': 'Wednesday',
          'days.4': 'Thursday',
          'days.5': 'Friday',
        };

        return days[key] ?? key;
      }

      if (namespace === 'Organizations.schedules.csv') {
        const labels: Record<string, string> = {
          'headers.degreeName': 'Degree',
          'headers.subjectCode': 'Subject code',
          'headers.subjectName': 'Subject',
          'headers.courseYear': 'Course',
          'headers.period': 'Period',
          'headers.shift': 'Shift',
          'headers.groupType': 'Group',
          'headers.day': 'Day',
          'headers.startTime': 'Start',
          'headers.endTime': 'End',
          'headers.classroom': 'Classroom',
          'values.annual': 'Annual',
          'values.common': 'Common',
          'values.unassigned': 'Unassigned',
          'groupTypes.theory': 'Theory',
          'shifts.morning': 'Morning',
          empty: 'No rows',
        };

        if (key === 'values.semester') return `Semester ${values?.period}`;

        return labels[key] ?? key;
      }

      return key;
    };
  }),
}));

const schedule = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  organizationId: testIds.organizationId,
  degreeId: testIds.degreeId,
  academicYearId: testIds.academicYearId,
  shift: 'morning',
  courseYear: 1,
  period: 1,
  conflicts: 0,
  unassigned: 0,
  status: 'draft',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
} satisfies ScheduleDTO;

const slot = {
  id: '123e4567-e89b-12d3-a456-426614174021',
  scheduleId: schedule.id,
  subjectGroupId: testIds.subjectGroupId,
  classroomId: testIds.classroomId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
  conflicts: [],
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
} satisfies ScheduleSlotDTO;

describe('generateScheduleCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a translated CSV with schedule metadata', async () => {
    const result = await generateScheduleCsv(
      schedule,
      [slot],
      [buildClassroom()],
      [buildSubject()],
      [buildSubjectGroup()],
      [buildDegree()],
      [buildAcademicYear()]
    );

    expect(result.filename).toBe('horario-2025-2026-P1.csv');
    expect(result.csv).toContain('Degree,Subject code,Subject');
    expect(result.csv).toContain('Computer Engineering,MAT101,Mathematics I');
    expect(result.csv).toContain('Semester 1');
    expect(result.csv).toContain('Morning');
    expect(result.csv).toContain('Theory 1');
    expect(result.csv).toContain('Monday');
    expect(result.csv).toContain('Aula 1.1');
  });

  it('uses fallbacks when optional classroom, degree and slot time are missing', async () => {
    const result = await generateScheduleCsv(
      schedule,
      [{ ...slot, classroomId: null, slotIndex: null, dayOfWeek: 9 }],
      [],
      [buildSubject({ degreeId: 'missing-degree' })],
      [buildSubjectGroup()],
      [],
      [buildAcademicYear({ periodType: 'annual' })]
    );

    expect(result.csv).toContain('Common');
    expect(result.csv).toContain('Annual');
    expect(result.csv).toContain('Unassigned');
    expect(result.csv).toContain('9');
  });

  it('honors a custom schedule time config', async () => {
    const timeConfig = {
      id: '123e4567-e89b-12d3-a456-426614174022',
      organizationId: testIds.organizationId,
      academicYearId: testIds.academicYearId,
      degreeId: testIds.degreeId,
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '09:00',
      endTime: '11:00',
      hasBreak: false,
      breakAfterSlot: null,
      createdAt: '2025-01-01T12:00:00Z',
      updatedAt: '2025-01-01T12:00:00Z',
    } satisfies ScheduleTimeConfigDTO;

    const result = await generateScheduleCsv(
      schedule,
      [slot],
      [buildClassroom()],
      [buildSubject()],
      [buildSubjectGroup()],
      [buildDegree()],
      [buildAcademicYear()],
      timeConfig
    );

    expect(result.csv).toContain('09:00');
    expect(result.csv).toContain('10:00');
  });

  it('throws when the academic year or valid rows are missing', async () => {
    await expect(
      generateScheduleCsv(schedule, [slot], [], [], [], [], [])
    ).rejects.toThrow('server');

    await expect(
      generateScheduleCsv(
        schedule,
        [slot],
        [],
        [],
        [buildSubjectGroup()],
        [],
        [buildAcademicYear()]
      )
    ).rejects.toThrow('No rows');
  });
});
