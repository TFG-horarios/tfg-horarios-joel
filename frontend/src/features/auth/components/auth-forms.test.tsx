import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LoginDTO, RegisterDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { loginAction, registerAction } from '@/features/auth/actions';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

vi.mock('@/features/auth/actions', () => ({
  loginAction: vi.fn<(data: LoginDTO) => Promise<{ success: true }>>(
    async () => ({ success: true })
  ),
  registerAction: vi.fn<(data: RegisterDTO) => Promise<{ success: true }>>(
    async () => ({ success: true })
  ),
}));

describe('auth forms', () => {
  it('submits valid login credentials', async () => {
    const { user } = renderWithUser(<LoginForm />);

    await user.type(screen.getByLabelText('fields.email.label'), 'ada@example.com');
    await user.type(screen.getByLabelText('fields.password.label'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
      });
    });
  });

  it('submits valid registration data', async () => {
    const { user } = renderWithUser(<RegisterForm />);

    await user.type(screen.getByLabelText('fields.name.label'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('fields.email.label'), 'ada@example.com');
    await user.type(screen.getByLabelText('fields.password.label'), 'password123');
    await user.type(
      screen.getByLabelText('fields.confirmPassword.label'),
      'password123'
    );
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(registerAction).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });
});
