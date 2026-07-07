import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setNavigationMocks } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceToolbar } from './resource-toolbar';

function Filter({ label }: { paramKey?: string; label: string }) {
  return <div>{label}</div>;
}

describe('ResourceToolbar', () => {
  it('keeps search, primary filters, clear control and actions in one toolbar', () => {
    setNavigationMocks({
      searchParams: 'status=active&shift=morning',
    });

    renderWithUser(
      <ResourceToolbar
        search={<input aria-label="Search" />}
        filters={
          <>
            <Filter paramKey="status" label="Status" />
            <Filter paramKey="degree" label="Degree" />
            <Filter paramKey="shift" label="Shift" />
            <Filter paramKey="type" label="Type" />
            <Filter label="Clear filters" />
          </>
        }
        viewToggle={<button type="button">View</button>}
        actions={<button type="button">Create</button>}
      />
    );

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Degree')).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /title/i })).toHaveTextContent(
      '1'
    );
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
