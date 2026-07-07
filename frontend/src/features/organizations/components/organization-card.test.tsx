import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildOrganization, testIds } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { OrganizationCard } from './organization-card';

describe('OrganizationCard', () => {
  it('renders organization navigation for read-only cards', () => {
    renderWithUser(<OrganizationCard organization={buildOrganization()} />);

    expect(
      screen.getByRole('heading', { name: 'Engineering School' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/organizations/${testIds.organizationId}`
    );
  });
});
