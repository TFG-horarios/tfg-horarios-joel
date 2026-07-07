import { cleanup, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import { ClassroomReservationCard } from './classroom-reservation-card';
import type { ClassroomReservationRowProps } from './classroom-reservation-row';

vi.mock('../actions', () => ({
  cancelReservationAction: vi.fn(),
  updateReservationStatusAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
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
  cancelTitle: 'Cancel reservation',
  cancelDescription: 'Cancel this reservation?',
  'requester.label': 'Requester',
  'requester.self': 'Me',
  'requester.unknown': 'Unknown',
} satisfies Record<string, string>;

const defaultProps = {
  item: buildClassroomReservation(),
  translations,
  classrooms: { [testIds.classroomId]: 'Lab 1' },
  memberRole: 'admin',
  currentUserId: 'admin-user',
  membersMap: { [testIds.requesterUserId]: 'Ada Lovelace' },
  academicYear: buildAcademicYear(),
} satisfies ClassroomReservationRowProps;

describe('ClassroomReservationCard', () => {
  beforeEach(() => {
    vi.mocked(updateReservationStatusAction).mockResolvedValue({
      success: true,
    });
    vi.mocked(cancelReservationAction).mockResolvedValue({
      success: true,
      message: 'Cancelled',
    });
  });

  it('shows reservation details and accepts pending reservations for managers', async () => {
    const { user } = renderWithUser(
      <ClassroomReservationCard {...defaultProps} />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lab 1' })).toBeInTheDocument();
    expect(screen.getByText('Final exam')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await user.click(screen.getByTitle('Accept'));

    await waitFor(() =>
      expect(updateReservationStatusAction).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.reservationId,
        { status: 'ACCEPTED' }
      )
    );
    expect(toast.success).toHaveBeenCalledWith('Reservation accepted');
  });

  it('reports status update failures and hides manager metadata for viewers', async () => {
    vi.mocked(updateReservationStatusAction).mockResolvedValueOnce({
      success: false,
      message: 'Cannot reject',
    });
    const { user } = renderWithUser(
      <ClassroomReservationCard {...defaultProps} />
    );

    await user.click(screen.getByTitle('Reject'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Cannot reject')
    );

    cleanup();
    renderWithUser(
      <ClassroomReservationCard
        {...defaultProps}
        item={buildClassroomReservation({ status: 'REJECTED', reason: null })}
        memberRole="viewer"
        currentUserId="other-user"
        membersMap={{}}
      />
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });
});
