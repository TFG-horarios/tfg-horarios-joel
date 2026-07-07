import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LoginDTO, RegisterDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { loginAction, registerAction } from '@/features/auth/actions';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

type TestActionResult<TData = void> =
  | { success: true; data?: TData }
  | { success: false; message?: string };

vi.mock('@/features/auth/actions', () => ({
  loginAction: vi.fn<(data: LoginDTO) => Promise<TestActionResult>>(
    async () => ({ success: true })
  ),
  registerAction: vi.fn<(data: RegisterDTO) => Promise<TestActionResult>>(
    async () => ({ success: true })
  ),
}));

describe('auth forms', () => {
  it('submits valid login credentials', async () => {
    const { user } = renderWithUser(<LoginForm />);

    await user.type(
      screen.getByLabelText('fields.email.label'),
      'ada@example.com'
    );
    await user.type(
      screen.getByLabelText('fields.password.label'),
      'password123'
    );
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
      });
    });
  });

  it('shows the login action message when credentials are rejected', async () => {
    vi.mocked(loginAction).mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials',
    });
    const { user } = renderWithUser(<LoginForm />);

    await user.type(
      screen.getByLabelText('fields.email.label'),
      'ada@example.com'
    );
    await user.type(
      screen.getByLabelText('fields.password.label'),
      'password123'
    );
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('submits valid registration data', async () => {
    const { user } = renderWithUser(<RegisterForm />);

    await user.type(screen.getByLabelText('fields.name.label'), 'Ada Lovelace');
    await user.type(
      screen.getByLabelText('fields.email.label'),
      'ada@example.com'
    );
    await user.type(
      screen.getByLabelText('fields.password.label'),
      'password123'
    );
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
