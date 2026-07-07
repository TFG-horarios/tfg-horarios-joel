import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SaveOrganizationDTO } from '@tfg-horarios/shared';
import { buildOrganization } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { createOrganizationAction } from '../actions';
import { OrganizationForm } from './organization-form';

vi.mock('../actions', () => ({
  createOrganizationAction: vi.fn<
    (data: SaveOrganizationDTO) => Promise<{ success: true }>
  >(async () => ({ success: true })),
  updateOrganizationAction: vi.fn(() =>
    vi.fn<(data: SaveOrganizationDTO) => Promise<{ success: true }>>(
      async () => ({ success: true })
    )
  ),
}));

describe('OrganizationForm', () => {
  it('creates organizations from submitted values', async () => {
    const { user } = renderWithUser(<OrganizationForm />);

    await user.type(screen.getByLabelText('name.label'), 'New School');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(createOrganizationAction).toHaveBeenCalledWith({
        name: 'New School',
      });
    });
  });

  it('pre-fills existing organizations for editing', () => {
    renderWithUser(<OrganizationForm organization={buildOrganization()} />);

    expect(screen.getByLabelText('name.label')).toHaveValue(
      'Engineering School'
    );
  });
});
