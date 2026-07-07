import { screen, waitFor } from '@testing-library/react';
import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import type { ActionResponse } from '@/types/actions';
import { ClassroomForm } from './classroom-form';

const savedClassroom = {
  id: '123e4567-e89b-12d3-a456-426614174200',
  organizationId: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Lab 1',
  capacity: 40,
  floor: 1,
  type: 'theory',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  deletedAt: null,
} satisfies ClassroomDTO;

describe('ClassroomForm', () => {
  it('submits classroom values with numeric fields coerced by the schema', async () => {
    const action = vi.fn(
      async (
        data: SaveClassroomDTO
      ): Promise<ActionResponse<ClassroomDTO>> => ({
        success: true,
        data: { ...savedClassroom, ...data },
      })
    );
    const { user } = renderWithUser(
      <ClassroomForm action={action} submitLabel="Save classroom" />
    );

    await user.type(screen.getByLabelText('name.label'), 'Theory 2');
    await user.clear(screen.getByLabelText('capacity.label'));
    await user.type(screen.getByLabelText('capacity.label'), '80');
    await user.clear(screen.getByLabelText('floor.label'));
    await user.type(screen.getByLabelText('floor.label'), '3');
    await user.click(screen.getByRole('button', { name: 'Save classroom' }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({
        name: 'Theory 2',
        capacity: 80,
        floor: 3,
        type: 'theory',
      });
    });
  });
});
