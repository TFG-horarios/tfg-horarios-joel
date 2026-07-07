import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ScheduleDTO } from '@tfg-horarios/shared';
import {
  buildAcademicYear,
  buildClassroom,
  buildDegree,
  buildItinerary,
  buildOrganization,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { SchedulePlanner } from './schedule-planner';

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    void loader();

    return function DynamicSchedulePlanner(props: { canUpdate?: boolean }) {
      return (
        <div>
          {props.canUpdate
            ? 'Editable schedule planner'
            : 'Read-only schedule planner'}
        </div>
      );
    };
  },
}));

vi.mock('./schedule-planner-editor', () => ({
  SchedulePlannerEditor: () => <div>Editable schedule planner</div>,
}));

vi.mock('./schedule-planner-read-only', () => ({
  SchedulePlannerReadOnly: () => <div>Read-only schedule planner</div>,
}));

const plannerProps = {
  organization: buildOrganization(),
  schedule: {
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
  } satisfies ScheduleDTO,
  initialSlots: [],
  classrooms: [buildClassroom()],
  subjects: [buildSubject()],
  subjectGroups: [buildSubjectGroup()],
  degrees: [buildDegree()],
  itineraries: [buildItinerary()],
  academicYear: buildAcademicYear(),
  timeConfig: null,
  canUpdate: false,
};

describe('SchedulePlanner', () => {
  it('renders the read-only planner for users without update permission', () => {
    renderWithUser(<SchedulePlanner {...plannerProps} />);

    expect(screen.getByText('Read-only schedule planner')).toBeInTheDocument();
  });

  it('renders the editor planner for users with update permission', () => {
    renderWithUser(<SchedulePlanner {...plannerProps} canUpdate />);

    expect(screen.getByText('Editable schedule planner')).toBeInTheDocument();
  });
});
