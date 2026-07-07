import { screen, waitFor } from '@testing-library/react';
import type { MemberDTO } from '@tfg-horarios/shared';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import type { ActionResponse } from '@/types/actions';
import { MemberForm, type MemberFormDTO } from './member-form';

describe('MemberForm', () => {
  const action = vi.fn(
    async (): Promise<ActionResponse<MemberDTO | void>> => ({
      success: true,
    })
  );

  it('renders an editable email input when creating a member', () => {
    renderWithUser(<MemberForm action={action} isEditing={false} />);

    expect(screen.getByLabelText('email.label')).toHaveAttribute(
      'type',
      'email'
    );
  });

  it('renders the current member email as read-only context while editing', () => {
    const defaultValues = { role: 'editor' } satisfies Partial<MemberFormDTO>;

    renderWithUser(
      <MemberForm
        action={action}
        isEditing={true}
        memberEmail="ada@example.com"
        defaultValues={defaultValues}
      />
    );

    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText('email.label')).not.toBeInTheDocument();
  });

  it('submits create values and calls the cancel handler when available', async () => {
    const onCancel = vi.fn<() => void>();
    const onSuccess = vi.fn<() => void>();
    const createAction = vi.fn(
      async (): Promise<ActionResponse<MemberDTO | void>> => ({
        success: true,
      })
    );
    const { user } = renderWithUser(
      <MemberForm
        action={createAction}
        isEditing={false}
        onCancel={onCancel}
        onSuccess={onSuccess}
        submitLabel="Invite"
        cancelLabel="Close"
      />
    );

    await user.type(screen.getByLabelText('email.label'), 'ada@example.com');
    await user.click(screen.getByRole('combobox', { name: 'role.label' }));
    await user.click(await screen.findByRole('option', { name: 'Editor' }));
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() => {
      expect(createAction).toHaveBeenCalledWith({
        email: 'ada@example.com',
        role: 'editor',
      });
      expect(onSuccess).toHaveBeenCalledOnce();
    });

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows action errors while editing a member role', async () => {
    const updateAction = vi.fn(
      async (): Promise<ActionResponse<MemberDTO | void>> => ({
        success: false,
        message: 'Cannot update member',
      })
    );
    const { user } = renderWithUser(
      <MemberForm
        action={updateAction}
        isEditing
        memberEmail="ada@example.com"
        defaultValues={{ role: 'admin' }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Cannot update member')).toBeInTheDocument();
  });
});
