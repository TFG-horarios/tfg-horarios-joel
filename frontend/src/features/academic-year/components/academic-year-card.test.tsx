import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAcademicYear, testIds } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { AcademicYearCard } from './academic-year-card';

describe('AcademicYearCard', () => {
  it('links to the academic year and renders active status', () => {
    const onEdit = vi.fn();

    renderWithUser(
      <AcademicYearCard
        organizationId={testIds.organizationId}
        academicYear={buildAcademicYear()}
        canEdit={false}
        onEdit={onEdit}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Curso 2025-2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/organizations/${testIds.organizationId}/academic-years/${testIds.academicYearId}`
    );
    expect(onEdit).not.toHaveBeenCalled();
  });
});
