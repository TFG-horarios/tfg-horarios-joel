import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SaveUserDTO } from '@tfg-horarios/shared';
import { mockRouterRefresh } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import {
  endProfileSessionAction,
  updatePasswordAction,
  updateProfileNameAction,
} from '../actions';
import { PasswordForm } from './password-form';
import { ProfileForm } from './profile-form';

const updateSessionData = vi.fn<(data: { name: string }) => void>();

vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({
    updateSessionData,
  }),
}));

vi.mock('../actions', () => ({
  updateProfileNameAction: vi.fn<
    (
      data: SaveUserDTO
    ) => Promise<{
      success: true;
      data: { id: string; name: string; email: string };
    }>
  >(async (data) => ({
    success: true,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: data.name,
      email: 'ada@example.com',
    },
  })),
  updatePasswordAction: vi.fn<
    (data: {
      currentPassword: string;
      newPassword: string;
    }) => Promise<{ success: true }>
  >(async () => ({ success: true })),
  endProfileSessionAction: vi.fn<(redirectTo: string) => Promise<void>>(
    async () => undefined
  ),
}));

describe('profile forms', () => {
  it('updates the profile name and session data', async () => {
    const { user } = renderWithUser(
      <ProfileForm user={{ name: 'Ada', email: 'ada@example.com' }} />
    );

    await user.clear(screen.getByLabelText('name'));
    await user.type(screen.getByLabelText('name'), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    await waitFor(() => {
      expect(updateProfileNameAction).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
      });
      expect(updateSessionData).toHaveBeenCalledWith({ name: 'Ada Lovelace' });
      expect(mockRouterRefresh).toHaveBeenCalledOnce();
    });
  });

  it('updates passwords and ends the session from the success dialog', async () => {
    const { user } = renderWithUser(<PasswordForm />);

    await user.type(screen.getByLabelText('currentPassword'), 'password123');
    await user.type(screen.getByLabelText('newPassword'), 'newpassword123');
    await user.type(screen.getByLabelText('confirmPassword'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    await waitFor(() => {
      expect(updatePasswordAction).toHaveBeenCalledWith({
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      });
    });

    await user.click(await screen.findByRole('button', { name: 'Aceptar' }));

    expect(endProfileSessionAction).toHaveBeenCalledWith('/login');
  });
});
