import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderWithUser } from '@/test/render';
import {
  buildAcademicYear,
  buildClassroomReservation,
  testIds,
} from '@/test/builders';
import {
  cancelReservationAction,
  updateReservationStatusAction,
} from '../actions';
import {
  ClassroomReservationRow,
  getSlotTimeRange,
  type ClassroomReservationRowProps,
} from './classroom-reservation-row';

vi.mock('../actions', () => ({
  cancelReservationAction: vi.fn(),
  updateReservationStatusAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const translations = {
  'status.ACCEPTED': 'Accepted',
  'status.REJECTED': 'Rejected',
  'status.PENDING': 'Pending',
  'status.CANCELLED': 'Cancelled',
  'action.accept': 'Accept',
  'action.reject': 'Reject',
  'action.cancel': 'Cancel',
  statusUpdateSuccess_ACCEPTED: 'Reservation accepted',
  statusUpdateSuccess_REJECTED: 'Reservation rejected',
  statusUpdateSuccess_CANCELLED: 'Reservation cancelled',
  statusUpdateError: 'Unable to update reservation',
  cancelError: 'Unable to cancel reservation',
  'requester.self': 'Me',
  'requester.unknown': 'Unknown',
};

function renderReservationRow(
  props: Partial<ClassroomReservationRowProps> = {}
) {
  const defaultProps = {
    item: buildClassroomReservation(),
    translations,
    classrooms: { [testIds.classroomId]: 'Lab 1' },
    memberRole: 'admin',
    currentUserId: 'admin-user',
    membersMap: { [testIds.requesterUserId]: 'Ada Lovelace' },
    academicYear: buildAcademicYear(),
  } satisfies ClassroomReservationRowProps;

  return renderWithUser(
    <table>
      <tbody>
        <ClassroomReservationRow {...defaultProps} {...props} />
      </tbody>
    </table>
  );
}

describe('getSlotTimeRange', () => {
  it('uses explicit reservation minutes when available', () => {
    expect(
      getSlotTimeRange(
        buildClassroomReservation({
          startTimeMinutes: 9 * 60 + 30,
          endTimeMinutes: 10 * 60 + 45,
          slotIndex: 4,
        }),
        buildAcademicYear()
      )
    ).toBe('09:30 - 10:45');
  });

  it('falls back to slot labels calculated from the academic year', () => {
    expect(
      getSlotTimeRange(
        2,
        buildAcademicYear({
          centerOpeningTime: '08:30',
          slotDurationMinutes: 45,
        })
      )
    ).toBe('10:00 - 10:45');
    expect(getSlotTimeRange(2)).toBe('Slot 2');
  });
});

describe('ClassroomReservationRow', () => {
  it('shows accept and reject actions for pending reservations managed by admins', async () => {
    const updateReservationStatus = vi.mocked(updateReservationStatusAction);
    updateReservationStatus.mockResolvedValue({ success: true });
    const { user } = renderReservationRow();

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Lab 1')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => {
      expect(updateReservationStatus).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.reservationId,
        { status: 'ACCEPTED' }
      );
      expect(toast.success).toHaveBeenCalledWith('Reservation accepted');
    });
  });

  it('lets the requester cancel an accepted reservation', async () => {
    const cancelReservation = vi.mocked(cancelReservationAction);
    cancelReservation.mockResolvedValue({ success: true });
    const { user } = renderReservationRow({
      item: buildClassroomReservation({ status: 'ACCEPTED' }),
      memberRole: 'viewer',
      currentUserId: testIds.requesterUserId,
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(cancelReservation).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.reservationId
      );
      expect(toast.success).toHaveBeenCalledWith('Reservation cancelled');
    });
  });

  it('hides row actions when the user cannot change the reservation', () => {
    renderReservationRow({
      item: buildClassroomReservation({ status: 'REJECTED' }),
      memberRole: 'viewer',
      currentUserId: 'other-user',
    });

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
