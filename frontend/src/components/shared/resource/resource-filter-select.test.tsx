import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRouterPush, setNavigationMocks } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceFilterSelect } from './resource-filter-select';

const options = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practice', value: 'practice' },
] satisfies Array<{ label: string; value: string }>;

describe('ResourceFilterSelect', () => {
  it('writes the selected value to the query string', async () => {
    setNavigationMocks({
      pathname: '/groups',
      searchParams: 'page=3',
    });
    const { user } = renderWithUser(
      <ResourceFilterSelect
        paramKey="type"
        placeholder="Type"
        options={options}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Theory' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/groups?type=theory');
  });

  it('clears the filter when the all option is selected', async () => {
    setNavigationMocks({
      pathname: '/groups',
      searchParams: 'type=practice&degree=1',
    });
    const { user } = renderWithUser(
      <ResourceFilterSelect
        paramKey="type"
        placeholder="Type"
        clearLabel="All"
        options={options}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'All' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/groups?degree=1');
  });

  it('supports searchable options with an explicit empty message', async () => {
    setNavigationMocks({
      pathname: '/groups',
      searchParams: 'type=theory',
    });
    const { user } = renderWithUser(
      <ResourceFilterSelect
        paramKey="type"
        placeholder="Type"
        options={options}
        searchable
        searchPlaceholder="Search type"
        emptyMessage="No type"
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search type'), 'zzz');

    expect(
      within(screen.getByRole('dialog')).getByText('No type')
    ).toBeInTheDocument();
  });
});
