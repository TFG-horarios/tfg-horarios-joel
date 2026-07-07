import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithUser } from '@/test/render';
import { OrganizationSectionShell } from './organization-section-shell';

describe('OrganizationSectionShell', () => {
  it('renders section metadata, count, action and content', () => {
    renderWithUser(
      <OrganizationSectionShell
        label="Overview"
        title="Academic years"
        description="Manage academic periods"
        count={3}
        countLabel="items"
        headerAction={<button type="button">Create</button>}
      >
        <p>Section content</p>
      </OrganizationSectionShell>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Academic years' })
    ).toBeInTheDocument();
    expect(screen.getByText('Manage academic periods')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('omits optional count and action when they are not provided', () => {
    renderWithUser(
      <OrganizationSectionShell
        label="Members"
        title="People"
        description="Manage access"
      >
        <p>Members content</p>
      </OrganizationSectionShell>
    );

    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument();
    expect(screen.queryByText(/items/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
