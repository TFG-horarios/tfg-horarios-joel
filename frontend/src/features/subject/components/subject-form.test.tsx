import { screen } from '@testing-library/react';
import type {
  DegreeDTO,
  ItineraryDTO,
  SubjectDTO,
} from '@tfg-horarios/shared';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import type { ActionResponse } from '@/types/actions';
import { testIds } from '@/test/builders';
import { SubjectForm, type SubjectFormDTO } from './subject-form';

const degree = {
  id: '123e4567-e89b-12d3-a456-426614174300',
  organizationId: testIds.organizationId,
  name: 'Computer Engineering',
  code: 'CE',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  deletedAt: null,
} satisfies DegreeDTO;

const itinerary = {
  id: '123e4567-e89b-12d3-a456-426614174301',
  organizationId: testIds.organizationId,
  degreeId: degree.id,
  name: 'Software Engineering',
  code: 'SE',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  deletedAt: null,
} satisfies ItineraryDTO;

const action = vi.fn(
  async (): Promise<ActionResponse<SubjectDTO>> => ({
    success: true,
  })
);

describe('SubjectForm', () => {
  it('does not render the degree selector while editing an existing subject', () => {
    const defaultValues = {
      name: 'Algorithms',
      code: 'ALG',
      degreeId: degree.id,
      availableShifts: ['morning'],
      numberOfStudents: 45,
      courseYear: 2,
      period: 0,
      weeklyHours: 6,
      isCommon: true,
    } satisfies Partial<SubjectFormDTO>;

    renderWithUser(
      <SubjectForm
        periodType="semester"
        action={action}
        defaultValues={defaultValues}
        degrees={[degree]}
        itineraries={[itinerary]}
        isEditing={true}
      />
    );

    expect(screen.queryByText('degreeId.label')).not.toBeInTheDocument();
    expect(screen.getByLabelText('name.label')).toHaveValue('Algorithms');
    expect(screen.getByLabelText('code.label')).toHaveValue('ALG');
    expect(screen.getByText('isCommon.label')).toBeInTheDocument();
  });

  it('renders degree and itinerary selectors when creating a non-common annual subject', () => {
    const defaultValues = {
      degreeId: degree.id,
      itineraryId: itinerary.id,
      isCommon: false,
      period: 0,
    } satisfies Partial<SubjectFormDTO>;

    renderWithUser(
      <SubjectForm
        periodType="annual"
        action={action}
        defaultValues={defaultValues}
        degrees={[degree]}
        itineraries={[itinerary]}
        isEditing={false}
      />
    );

    expect(screen.getByText('degreeId.label')).toBeInTheDocument();
    expect(screen.getByText('itineraryId.label')).toBeInTheDocument();
    expect(screen.getAllByText('Anual').length).toBeGreaterThan(0);
  });

  it('renders trimester period options for trimester academic years', () => {
    renderWithUser(
      <SubjectForm
        periodType="trimester"
        action={action}
        degrees={[degree]}
        itineraries={[itinerary]}
        isEditing={false}
      />
    );

    expect(screen.getAllByText('1º Trimestre').length).toBeGreaterThan(0);
  });
});
