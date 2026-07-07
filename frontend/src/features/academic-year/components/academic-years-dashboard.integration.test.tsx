import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAcademicYear, buildOrganization, testIds } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { setNavigationMocks } from '@/test/navigation-mocks';
import { AcademicYearsDashboard } from './academic-years-dashboard';

vi.mock('../actions', () => ({
  createAcademicYearAction: vi.fn(),
  deleteAcademicYearAction: vi.fn(),
  updateAcademicYearAction: vi.fn(),
}));

describe('AcademicYearsDashboard integration', () => {
  it('sorts active courses first and filters by q search param', () => {
    setNavigationMocks({
      searchParams: 'q=2026',
      pathname: `/organizations/${testIds.organizationId}`,
    });

    renderWithUser(
      <AcademicYearsDashboard
        organization={buildOrganization()}
        memberRole="admin"
        initialAcademicYears={[
          buildAcademicYear({
            id: 'year-2024',
            name: '2024-2025',
            isActive: false,
          }),
          buildAcademicYear({
            id: 'year-2026',
            name: '2026-2027',
            isActive: true,
          }),
        ]}
      />
    );

    expect(screen.getByText('Curso 2026-2027')).toBeInTheDocument();
    expect(screen.queryByText('Curso 2024-2025')).not.toBeInTheDocument();
  });

  it('hides create controls for members without edit permissions', () => {
    setNavigationMocks({ searchParams: '' });

    renderWithUser(
      <AcademicYearsDashboard
        organization={buildOrganization()}
        memberRole="viewer"
        initialAcademicYears={[buildAcademicYear()]}
      />
    );

    const dashboard = screen.getByText('Cursos Académicos').closest('div');
    expect(dashboard).not.toBeNull();
    expect(
      within(document.body).queryByRole('button', { name: 'Crear curso' })
    ).not.toBeInTheDocument();
  });
});
