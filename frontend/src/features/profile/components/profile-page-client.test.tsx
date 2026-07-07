import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { UserDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { getMockRouter } from '@/test/navigation-mocks';
import { ProfilePageClient } from './profile-page-client';
import { deleteAccountAction, endProfileSessionAction } from '../actions';
import { toast } from 'sonner';

vi.mock('../actions', () => ({
  deleteAccountAction: vi.fn(),
  endProfileSessionAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('./profile-form', () => ({
  ProfileForm: ({ user }: { user: UserDTO }) => (
    <div>Profile form {user.email}</div>
  ),
}));

vi.mock('./password-form', () => ({
  PasswordForm: () => <div>Password form</div>,
}));

vi.mock('@/components/i18n/language-toggle', () => ({
  LanguageToggle: () => <button type="button">Language toggle</button>,
}));

vi.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme toggle</button>,
}));

vi.mock('@/components/shared/resource/resource-delete-action', () => ({
  ResourceDeleteAction: ({
    children,
    onDelete,
  }: {
    children: ReactNode;
    onDelete: () => Promise<{ success: boolean; message?: string } | void>;
  }) => {
    if (!isValidElement(children)) return null;

    return cloneElement(children as ReactElement<{ onClick?: () => void }>, {
      onClick: () => void onDelete(),
    });
  },
}));

const user = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
} satisfies UserDTO;

describe('ProfilePageClient', () => {
  beforeEach(() => {
    vi.mocked(deleteAccountAction).mockResolvedValue({ success: true });
  });

  it('renders profile sections and navigates back', async () => {
    const router = getMockRouter();
    const { user: actor } = renderWithUser(<ProfilePageClient user={user} />);

    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(
      screen.getByText('Profile form ada@example.com')
    ).toBeInTheDocument();
    expect(screen.getByText('Password form')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Theme toggle' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Language toggle' })
    ).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'back' }));

    expect(router.back).toHaveBeenCalled();
  });

  it('shows success dialog after deleting the account and ends the session', async () => {
    const { user: actor } = renderWithUser(<ProfilePageClient user={user} />);

    await actor.click(
      screen.getByRole('button', { name: 'deleteAccountButton' })
    );

    expect(deleteAccountAction).toHaveBeenCalled();
    expect(
      await screen.findByRole('heading', { name: 'deleteSuccessTitle' })
    ).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'continue' }));

    expect(endProfileSessionAction).toHaveBeenCalledWith('/');
  });

  it('reports delete failures without opening the success dialog', async () => {
    vi.mocked(deleteAccountAction).mockResolvedValueOnce({
      success: false,
      message: 'Cannot delete',
    });
    const { user: actor } = renderWithUser(<ProfilePageClient user={user} />);

    await actor.click(
      screen.getByRole('button', { name: 'deleteAccountButton' })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Cannot delete', {
        duration: 8000,
      })
    );
    expect(
      screen.queryByRole('heading', { name: 'deleteSuccessTitle' })
    ).not.toBeInTheDocument();
  });
});
