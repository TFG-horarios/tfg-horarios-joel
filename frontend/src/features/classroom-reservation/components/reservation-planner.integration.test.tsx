import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  buildAcademicYear,
  buildClassroomReservation,
  buildClassroom,
  buildOrganization,
  testIds,
} from '@/test/builders';
import { setNavigationMocks } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { createApiEventSource } from '@/lib/api/realtime';
import { fetchOccupiedSlotsAction, requestReservationAction } from '../actions';
import { ReservationPlanner } from './reservation-planner';
import { toast } from 'sonner';

type TimelineDay = {
  value: number;
  date?: Date;
  label: string;
};

type TimelineEvent = {
  id: string;
  reason: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
};

type TimelineProps = {
  daysOfWeek: TimelineDay[];
  startTimeMinutes: number;
  endTimeMinutes: number;
  events: TimelineEvent[];
  onEmptyClick: (selection: {
    day: TimelineDay;
    startTimeMinutes: number;
    endTimeMinutes: number;
    clickedTimeMinutes: number;
  }) => void;
  renderEvent: (event: TimelineEvent) => React.ReactNode;
};

vi.mock('@/components/shared/schedule/classroom-timeline-week', () => ({
  ClassroomTimelineWeek: (props: TimelineProps) => (
    <div>
      <div data-testid="timeline-range">
        {props.startTimeMinutes}-{props.endTimeMinutes}
      </div>
      <div data-testid="timeline-events">{props.events.length}</div>
      {props.events.map((event) => (
        <div key={event.id}>{props.renderEvent(event)}</div>
      ))}
      <button
        type="button"
        onClick={() =>
          props.onEmptyClick({
            day: props.daysOfWeek[0]!,
            startTimeMinutes: 600,
            endTimeMinutes: 660,
            clickedTimeMinutes: 600,
          })
        }
      >
        empty slot
      </button>
      <button
        type="button"
        onClick={() =>
          props.onEmptyClick({
            day: { ...props.daysOfWeek[0]!, date: undefined },
            startTimeMinutes: 600,
            endTimeMinutes: 660,
            clickedTimeMinutes: 600,
          })
        }
      >
        empty slot without date
      </button>
    </div>
  ),
}));

vi.mock('@/lib/api/realtime', () => ({
  createApiEventSource: vi.fn(),
}));

vi.mock('../actions', () => ({
  fetchOccupiedSlotsAction: vi.fn(),
  requestReservationAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createApiEventSourceMock = vi.mocked(createApiEventSource);
const fetchOccupiedSlotsActionMock = vi.mocked(fetchOccupiedSlotsAction);
const requestReservationActionMock = vi.mocked(requestReservationAction);
const toastErrorMock = vi.mocked(toast.error);

function createMockEventSource() {
  return {
    addEventListener: vi.fn(),
    close: vi.fn(),
    onerror: null,
    onmessage: null,
    onopen: null,
    readyState: 1,
    url: 'http://localhost/events',
    withCredentials: false,
    CONNECTING: 0 as const,
    OPEN: 1 as const,
    CLOSED: 2 as const,
  } as unknown as EventSource;
}

describe('ReservationPlanner integration', () => {
  it('loads occupancy for the selected classroom and submits a reservation', async () => {
    setNavigationMocks({
      pathname: '/reservations/new',
      searchParams: `classroomId=${testIds.classroomId}&date=2026-09-14`,
    });
    createApiEventSourceMock.mockReturnValue(createMockEventSource());
    fetchOccupiedSlotsActionMock.mockResolvedValue({
      success: true,
      data: {
        occupiedSlots: [
          {
            date: '2026-09-14',
            startTimeMinutes: 720,
            endTimeMinutes: 780,
            reason: 'Reservado',
          },
        ],
      },
    });
    requestReservationActionMock.mockResolvedValue({
      success: true,
      data: buildClassroomReservation({ status: 'ACCEPTED' }),
    });
    const { user } = renderWithUser(
      <ReservationPlanner
        organization={buildOrganization()}
        classrooms={[buildClassroom({ name: 'Lab 1', capacity: 25 })]}
        academicYear={buildAcademicYear({
          period0Start: '2026-09-01',
          period0End: '2027-06-30',
          period1Start: '2026-09-01',
          period1End: '2027-01-31',
          period2Start: '2027-02-01',
          period2End: '2027-06-30',
          centerOpeningTime: '08:00',
          centerClosingTime: '14:00',
        })}
      />
    );

    await waitFor(() => {
      expect(fetchOccupiedSlotsActionMock).toHaveBeenCalled();
    });
    await user.click(screen.getByRole('button', { name: 'empty slot' }));
    await user.type(screen.getByPlaceholderText('reasonPlaceholder'), 'Exam');
    await user.click(screen.getByRole('button', { name: 'confirm' }));

    expect(screen.getByTestId('timeline-range')).toHaveTextContent('480-840');
    expect(await screen.findByText('reserved')).toBeInTheDocument();
    await waitFor(() => {
      expect(requestReservationActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        {
          classroomId: testIds.classroomId,
          academicYearId: testIds.academicYearId,
          date: '2026-09-14',
          startTimeMinutes: 600,
          endTimeMinutes: 660,
          reason: 'Exam',
        }
      );
    });
  });

  it('shows occupancy load errors without opening the event stream twice', async () => {
    setNavigationMocks({
      pathname: '/reservations/new',
      searchParams: `classroomId=${testIds.classroomId}&date=2026-09-14`,
    });
    createApiEventSourceMock.mockReturnValue(createMockEventSource());
    fetchOccupiedSlotsActionMock.mockResolvedValue({
      success: false,
      message: 'Load failed',
    });

    renderWithUser(
      <ReservationPlanner
        organization={buildOrganization()}
        classrooms={[buildClassroom({ name: 'Lab 1', capacity: 25 })]}
        academicYear={buildAcademicYear({
          period0Start: '2026-09-01',
          period0End: '2027-06-30',
        })}
      />
    );

    expect(await screen.findByText('Load failed')).toBeInTheDocument();
    expect(createApiEventSourceMock).toHaveBeenCalledWith(
      `/api/organizations/${testIds.organizationId}/classroom-reservations/classrooms/${testIds.classroomId}/events`
    );
  });

  it('rejects invalid custom ranges before submitting', async () => {
    setNavigationMocks({
      pathname: '/reservations/new',
      searchParams: `classroomId=${testIds.classroomId}&date=2026-09-14`,
    });
    createApiEventSourceMock.mockReturnValue(createMockEventSource());
    fetchOccupiedSlotsActionMock.mockResolvedValue({
      success: true,
      data: { occupiedSlots: [] },
    });
    renderWithUser(
      <ReservationPlanner
        organization={buildOrganization()}
        classrooms={[buildClassroom({ name: 'Lab 1', capacity: 25 })]}
        academicYear={buildAcademicYear({
          period0Start: '2026-09-01',
          period0End: '2027-06-30',
        })}
      />
    );

    await waitFor(() => {
      expect(fetchOccupiedSlotsActionMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'empty slot' }));
    fireEvent.change(screen.getByDisplayValue('10:00'), {
      target: { value: '11:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm' }));

    expect(toastErrorMock).toHaveBeenCalledWith('rangeError');
    expect(requestReservationActionMock).not.toHaveBeenCalled();
  });

  it('surfaces request failures from the action', async () => {
    setNavigationMocks({
      pathname: '/reservations/new',
      searchParams: `classroomId=${testIds.classroomId}&date=2026-09-14`,
    });
    createApiEventSourceMock.mockReturnValue(createMockEventSource());
    fetchOccupiedSlotsActionMock.mockResolvedValue({
      success: true,
      data: { occupiedSlots: [] },
    });
    requestReservationActionMock.mockResolvedValue({
      success: false,
      message: 'ERR_CONFLICT',
    });
    renderWithUser(
      <ReservationPlanner
        organization={buildOrganization()}
        classrooms={[buildClassroom({ name: 'Lab 1', capacity: 25 })]}
        academicYear={buildAcademicYear({
          period0Start: '2026-09-01',
          period0End: '2027-06-30',
        })}
      />
    );

    await waitFor(() => {
      expect(fetchOccupiedSlotsActionMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'empty slot' }));
    fireEvent.click(screen.getByRole('button', { name: 'confirm' }));

    await waitFor(() => {
      expect(requestReservationActionMock).toHaveBeenCalled();
      expect(toastErrorMock).toHaveBeenCalledWith('ERR_CONFLICT');
    });
  });
});
