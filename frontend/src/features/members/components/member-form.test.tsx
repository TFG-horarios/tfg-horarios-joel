import { screen } from '@testing-library/react';
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
});
