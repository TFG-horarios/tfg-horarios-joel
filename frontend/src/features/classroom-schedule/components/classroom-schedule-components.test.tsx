import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { ClassroomOccupancyEventDTO } from '@tfg-horarios/shared';
import {
  buildAcademicYear,
  buildClassroom,
  buildDegree,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ClassroomScheduleCard } from './classroom-schedule-card';
import { ClassroomSchedulePlanner } from './classroom-schedule-planner';
import { ClassroomScheduleRow } from './classroom-schedule-row';
import type { ClassroomScheduleDTO } from '../types';
import { useScheduleExport } from '@/components/shared/schedule/use-schedule-export';

type TimelineEvent = {
  id: string;
  day: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
};

vi.mock('@/components/shared/schedule/use-schedule-export', () => ({
  useScheduleExport: vi.fn(),
}));

vi.mock('@/components/shared/schedule/classroom-timeline-week', () => ({
  ClassroomTimelineWeek: ({
    daysOfWeek,
    events,
    renderEvent,
  }: {
    daysOfWeek: Array<{ value: number; label: string }>;
    events: TimelineEvent[];
    renderEvent: (event: TimelineEvent) => ReactNode;
  }) => (
    <div>
      <div>{daysOfWeek.map((day) => day.label).join(',')}</div>
      {events.map((event) => (
        <section key={event.id}>{renderEvent(event)}</section>
      ))}
    </div>
  ),
}));

const classroomSchedule = {
  classroomId: testIds.classroomId,
  academicYearId: testIds.academicYearId,
  shift: 'morning',
  period: 1,
} satisfies ClassroomScheduleDTO;

const occupancyEvent = {
  id: '123e4567-e89b-12d3-a456-426614174030',
  type: 'class',
  classroomId: testIds.classroomId,
  scheduleId: '123e4567-e89b-12d3-a456-426614174020',
  subjectGroupId: testIds.subjectGroupId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
  period: 1,
  shift: 'morning',
  startTimeMinutes: 540,
  endTimeMinutes: 600,
} satisfies ClassroomOccupancyEventDTO;

describe('classroom schedule components', () => {
  beforeEach(() => {
    vi.mocked(useScheduleExport).mockReturnValue({
      isExportingPDF: false,
      gridRef: { current: null },
      exportPDF: vi.fn(),
    });
  });

  it('renders classroom schedule cards and rows with links', () => {
    renderWithUser(
      <>
        <ClassroomScheduleCard
          item={classroomSchedule}
          classroomMap={{ [testIds.classroomId]: 'Aula 1.1' }}
          organizationId={testIds.organizationId}
          academicYearId={testIds.academicYearId}
          translations={{ shift_morning: 'Morning', period: 'Period' }}
        />
        <table>
          <tbody>
            <ClassroomScheduleRow
              item={{ ...classroomSchedule, shift: 'afternoon' }}
              classroomMap={{}}
              organizationId={testIds.organizationId}
              academicYearId={testIds.academicYearId}
              translations={{ shift_afternoon: 'Afternoon' }}
            />
          </tbody>
        </table>
      </>
    );

    expect(
      screen.getByRole('heading', { name: 'Aula 1.1' })
    ).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'unknownClassroom' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Afternoon' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      `/organizations/${testIds.organizationId}/academic-years/${testIds.academicYearId}/classroom-schedules/${testIds.classroomId}?shift=morning&period=1`
    );
  });

  it('renders planner events and exports the current classroom schedule', async () => {
    const exportPDF = vi.fn();
    vi.mocked(useScheduleExport).mockReturnValue({
      isExportingPDF: false,
      gridRef: { current: null },
      exportPDF,
    });
    const { user } = renderWithUser(
      <ClassroomSchedulePlanner
        events={[
          occupancyEvent,
          { ...occupancyEvent, id: 'outside', dayOfWeek: 6 },
        ]}
        classroom={buildClassroom()}
        subjects={[buildSubject()]}
        subjectGroups={[buildSubjectGroup()]}
        degrees={[buildDegree()]}
        academicYear={buildAcademicYear()}
        shift="morning"
        period={1}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Aula 1.1' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('days.1,days.2,days.3,days.4,days.5')
    ).toBeInTheDocument();
    expect(screen.getByText('Mathematics I')).toBeInTheDocument();
    expect(screen.getByText('Computer Engineering')).toBeInTheDocument();
    expect(screen.queryByText('outside')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Exportar PDF/ }));

    expect(exportPDF).toHaveBeenCalledWith('horario-Aula 1.1-2025-2026-P1');
  });
});
