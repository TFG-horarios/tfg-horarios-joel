import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { testIds } from '@/test/builders';
import { NotificationBell } from './notification-bell';
import {
  fetchPaginatedNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '../actions';
import { createApiEventSource, parseEventData } from '@/lib/api/realtime';
import { toast } from 'sonner';

vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({
    user: {
      id: testIds.requesterUserId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    },
  }),
}));

vi.mock('../actions', () => ({
  fetchPaginatedNotificationsAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
  markNotificationReadAction: vi.fn(),
}));

const closeMock = vi.fn();
const listeners = new Map<string, (event: Event) => void>();

vi.mock('@/lib/api/realtime', () => ({
  createApiEventSource: vi.fn(() => ({
    addEventListener: vi.fn(
      (type: string, listener: (event: Event) => void) => {
        listeners.set(type, listener);
      }
    ),
    close: closeMock,
  })),
  parseEventData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const notification = {
  id: '123e4567-e89b-12d3-a456-426614174023',
  userId: testIds.requesterUserId,
  organizationId: testIds.organizationId,
  title: 'Schedule ready',
  message: 'The generation finished',
  type: 'SUCCESS',
  isRead: false,
  createdAt: new Date(Date.now() - 60_000).toISOString(),
} satisfies NotificationDTO;

describe('NotificationBell', () => {
  beforeEach(() => {
    listeners.clear();
    vi.mocked(fetchPaginatedNotificationsAction).mockResolvedValue({
      data: [notification],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(markNotificationReadAction).mockResolvedValue({ success: true });
    vi.mocked(markAllNotificationsReadAction).mockResolvedValue({
      success: true,
    });
    vi.mocked(parseEventData).mockReturnValue(notification);
  });

  it('fetches notifications when opened and can mark one as read', async () => {
    const { user } = renderWithUser(<NotificationBell />);

    const trigger = screen.getAllByRole('button')[0];
    if (!trigger) throw new Error('Expected notification trigger');

    await user.click(trigger);

    expect(fetchPaginatedNotificationsAction).toHaveBeenCalledWith(
      testIds.requesterUserId,
      { page: 1, limit: 10 }
    );
    expect(await screen.findByText('Schedule ready')).toBeInTheDocument();

    await user.click(screen.getByText('Schedule ready'));

    expect(markNotificationReadAction).toHaveBeenCalledWith(
      testIds.requesterUserId,
      notification.id
    );
  });

  it('marks all notifications as read and reports failures', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(markAllNotificationsReadAction).mockResolvedValueOnce({
      success: false,
      message: 'Cannot mark all',
    });
    const { user } = renderWithUser(<NotificationBell />);

    const trigger = screen.getAllByRole('button')[0];
    if (!trigger) throw new Error('Expected notification trigger');

    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: /markAll/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('markAllReadError')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking all notifications as read:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('subscribes to realtime notifications and shows toast feedback', async () => {
    renderWithUser(<NotificationBell />);

    expect(createApiEventSource).toHaveBeenCalledWith(
      `/api/users/${testIds.requesterUserId}/notifications/stream`
    );

    await act(async () => {
      listeners.get('notification_received')?.(new Event('message'));
    });

    expect(parseEventData).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Schedule ready', {
      description: 'The generation finished',
    });
  });
});
