import { screen, waitFor } from '@testing-library/react';
import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import type { ActionResponse } from '@/types/actions';
import { DegreeForm } from './degree-form';

const savedDegree = {
  id: '123e4567-e89b-12d3-a456-426614174100',
  organizationId: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Computer Engineering',
  code: 'CE',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  deletedAt: null,
} satisfies DegreeDTO;

describe('DegreeForm', () => {
  it('submits degree values and calls onSuccess', async () => {
    const action = vi.fn(
      async (data: SaveDegreeDTO): Promise<ActionResponse<DegreeDTO>> => ({
        success: true,
        data: { ...savedDegree, ...data },
      })
    );
    const onSuccess = vi.fn<(data?: DegreeDTO) => void>();
    const { user } = renderWithUser(
      <DegreeForm
        action={action}
        onSuccess={onSuccess}
        submitLabel="Save degree"
      />
    );

    await user.type(screen.getByLabelText('name.label'), 'Mathematics');
    await user.type(screen.getByLabelText('code.label'), 'MATH');
    await user.click(screen.getByRole('button', { name: 'Save degree' }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({
        name: 'Mathematics',
        code: 'MATH',
      });
      expect(onSuccess).toHaveBeenCalledWith({
        ...savedDegree,
        name: 'Mathematics',
        code: 'MATH',
      });
    });
  });

  it('renders default values and delegates cancellation', async () => {
    const action = vi.fn(
      async (): Promise<ActionResponse<DegreeDTO>> => ({
        success: true,
        data: savedDegree,
      })
    );
    const onCancel = vi.fn<() => void>();
    const { user } = renderWithUser(
      <DegreeForm
        action={action}
        defaultValues={{ name: 'Physics', code: 'PHY' }}
        cancelLabel="Close"
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText('name.label')).toHaveValue('Physics');
    expect(screen.getByLabelText('code.label')).toHaveValue('PHY');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });
});
