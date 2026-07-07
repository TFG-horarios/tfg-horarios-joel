import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ItineraryDTO } from '@tfg-horarios/shared';
import { buildDegree, buildItinerary } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ItineraryForm, type ItineraryFormDTO } from './itinerary-form';

describe('ItineraryForm', () => {
  it('shows the degree selector only while creating', () => {
    const action = vi.fn<
      (data: ItineraryFormDTO) => Promise<{ success: true; data: ItineraryDTO }>
    >(async () => ({ success: true, data: buildItinerary() }));

    renderWithUser(
      <ItineraryForm
        action={action}
        degrees={[buildDegree()]}
        isEditing={false}
      />
    );

    expect(screen.getByRole('combobox', { name: 'degreeId.label' })).toBeInTheDocument();
  });

  it('uses default values and exposes cancel while editing', async () => {
    const onCancel = vi.fn();
    const action = vi.fn<
      (data: ItineraryFormDTO) => Promise<{ success: true; data: ItineraryDTO }>
    >(async () => ({ success: true, data: buildItinerary() }));

    const { user } = renderWithUser(
      <ItineraryForm
        action={action}
        degrees={[buildDegree()]}
        defaultValues={{
          name: 'Legacy',
          code: 'LEG',
        }}
        isEditing
        onCancel={onCancel}
      />
    );

    expect(screen.queryByRole('combobox', { name: 'degreeId.label' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('name.label')).toHaveValue('Legacy');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
