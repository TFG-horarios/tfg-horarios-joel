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

type TestProfileResult =
  | { success: true; data?: { id: string; name: string; email: string } }
  | { success: false; message?: string };
type TestPasswordResult =
  | { success: true }
  | { success: false; message?: string };

vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({
    updateSessionData,
  }),
}));

vi.mock('../actions', () => ({
  updateProfileNameAction: vi.fn<
    (data: SaveUserDTO) => Promise<TestProfileResult>
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
    }) => Promise<TestPasswordResult>
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

  it('uses the submitted name when the profile action omits returned data', async () => {
    vi.mocked(updateProfileNameAction).mockResolvedValueOnce({
      success: true,
    });
    const { user } = renderWithUser(
      <ProfileForm user={{ name: 'Ada', email: 'ada@example.com' }} />
    );

    await user.clear(screen.getByLabelText('name'));
    await user.type(screen.getByLabelText('name'), 'Ada Byron');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    await waitFor(() => {
      expect(updateSessionData).toHaveBeenCalledWith({ name: 'Ada Byron' });
    });
  });

  it('shows the profile action error without refreshing the route', async () => {
    vi.mocked(updateProfileNameAction).mockResolvedValueOnce({
      success: false,
      message: 'Name rejected',
    });
    const { user } = renderWithUser(
      <ProfileForm user={{ name: 'Ada', email: 'ada@example.com' }} />
    );

    await user.clear(screen.getByLabelText('name'));
    await user.type(screen.getByLabelText('name'), 'Rejected');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    expect(await screen.findByText('Name rejected')).toBeInTheDocument();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
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

  it('shows password action errors and keeps the success dialog closed', async () => {
    vi.mocked(updatePasswordAction).mockResolvedValueOnce({
      success: false,
      message: 'Wrong password',
    });
    const { user } = renderWithUser(<PasswordForm />);

    await user.type(screen.getByLabelText('currentPassword'), 'password123');
    await user.type(screen.getByLabelText('newPassword'), 'newpassword123');
    await user.type(screen.getByLabelText('confirmPassword'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('Wrong password')).toBeInTheDocument();
    expect(
      screen.queryByText('Contraseña Actualizada')
    ).not.toBeInTheDocument();
  });

  it('does not submit password changes when confirmation does not match', async () => {
    const { user } = renderWithUser(<PasswordForm />);

    await user.type(screen.getByLabelText('currentPassword'), 'password123');
    await user.type(screen.getByLabelText('newPassword'), 'newpassword123');
    await user.type(screen.getByLabelText('confirmPassword'), 'different123');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(updatePasswordAction).not.toHaveBeenCalled();
  });
});
