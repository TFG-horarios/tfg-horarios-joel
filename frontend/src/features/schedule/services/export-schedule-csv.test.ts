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
import { buildScheduleCsvExport } from './export-schedule-csv';
import { generateScheduleCsv } from '../utils';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchScheduleTimeConfigs } from '@/features/schedule-time-config/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchScheduleById, fetchScheduleSlots } from '../queries';

vi.mock('@/features/academic-year/queries', () => ({
  fetchAcademicYears: vi.fn(),
}));

vi.mock('@/features/classroom/queries', () => ({
  fetchAllClassrooms: vi.fn(),
}));

vi.mock('@/features/degree/queries', () => ({
  fetchAllDegrees: vi.fn(),
}));

vi.mock('@/features/schedule-time-config/queries', () => ({
  fetchScheduleTimeConfigs: vi.fn(),
}));

vi.mock('@/features/subject/queries', () => ({
  fetchAllSubjects: vi.fn(),
}));

vi.mock('@/features/subject-group/queries', () => ({
  fetchAllSubjectGroups: vi.fn(),
}));

vi.mock('../queries', () => ({
  fetchScheduleById: vi.fn(),
  fetchScheduleSlots: vi.fn(),
}));

vi.mock('../utils', () => ({
  generateScheduleCsv: vi.fn(async () => ({
    csv: 'Degree,Subject',
    filename: 'schedule.csv',
  })),
}));

const schedule = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  organizationId: testIds.organizationId,
  degreeId: testIds.degreeId,
  academicYearId: testIds.academicYearId,
  timeConfigId: '123e4567-e89b-12d3-a456-426614174022',
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

const timeConfig = {
  id: '123e4567-e89b-12d3-a456-426614174022',
  organizationId: testIds.organizationId,
  academicYearId: testIds.academicYearId,
  degreeId: testIds.degreeId,
  itineraryId: null,
  courseYear: 1,
  period: 1,
  shift: 'morning',
  startTime: '08:00',
  endTime: '14:00',
  hasBreak: false,
  breakAfterSlot: null,
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
} satisfies ScheduleTimeConfigDTO;

describe('buildScheduleCsvExport', () => {
  beforeEach(() => {
    vi.mocked(fetchScheduleById).mockResolvedValue(schedule);
    vi.mocked(fetchScheduleSlots).mockResolvedValue([slot]);
    vi.mocked(fetchAllClassrooms).mockResolvedValue([buildClassroom()]);
    vi.mocked(fetchAllSubjects).mockResolvedValue([buildSubject()]);
    vi.mocked(fetchAllSubjectGroups).mockResolvedValue([buildSubjectGroup()]);
    vi.mocked(fetchAllDegrees).mockResolvedValue([buildDegree()]);
    vi.mocked(fetchAcademicYears).mockResolvedValue([buildAcademicYear()]);
    vi.mocked(fetchScheduleTimeConfigs).mockResolvedValue([timeConfig]);
    vi.clearAllMocks();
  });

  it('collects schedule dependencies and delegates CSV generation', async () => {
    const result = await buildScheduleCsvExport(
      testIds.organizationId,
      schedule.id
    );

    expect(result).toEqual({ csv: 'Degree,Subject', filename: 'schedule.csv' });
    expect(generateScheduleCsv).toHaveBeenCalledWith(
      schedule,
      [slot],
      [buildClassroom()],
      [buildSubject()],
      [buildSubjectGroup()],
      [buildDegree()],
      [buildAcademicYear()],
      timeConfig
    );
  });

  it('returns null when the schedule or slots are missing', async () => {
    vi.mocked(fetchScheduleById).mockResolvedValueOnce(null);

    await expect(
      buildScheduleCsvExport(testIds.organizationId, schedule.id)
    ).resolves.toBeNull();

    vi.mocked(fetchScheduleById).mockResolvedValueOnce(schedule);
    vi.mocked(fetchScheduleSlots).mockResolvedValueOnce(
      null as unknown as Awaited<ReturnType<typeof fetchScheduleSlots>>
    );

    await expect(
      buildScheduleCsvExport(testIds.organizationId, schedule.id)
    ).resolves.toBeNull();
  });

  it('continues without a time config when fetching configs fails', async () => {
    vi.mocked(fetchScheduleTimeConfigs).mockRejectedValueOnce(
      new Error('unavailable')
    );

    await buildScheduleCsvExport(testIds.organizationId, schedule.id);

    expect(generateScheduleCsv).toHaveBeenCalledWith(
      schedule,
      [slot],
      [buildClassroom()],
      [buildSubject()],
      [buildSubjectGroup()],
      [buildDegree()],
      [buildAcademicYear()],
      null
    );
  });
});
