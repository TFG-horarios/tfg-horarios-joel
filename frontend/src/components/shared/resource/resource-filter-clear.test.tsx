import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRouterPush, setNavigationMocks } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceFilterClear } from './resource-filter-clear';

describe('ResourceFilterClear', () => {
  it('renders only when a real filter is active', () => {
    setNavigationMocks({ searchParams: 'page=2&limit=20&view=list' });

    const { rerender } = renderWithUser(<ResourceFilterClear />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    setNavigationMocks({ searchParams: 'page=2&limit=20&q=math' });
    rerender(<ResourceFilterClear />);

    expect(
      screen.getByRole('button', { name: /resetFilters/i })
    ).toBeInTheDocument();
  });

  it('clears filters and preserves list preferences', async () => {
    setNavigationMocks({
      pathname: '/classrooms',
      searchParams: 'limit=20&view=grid&q=lab',
    });
    const { user } = renderWithUser(<ResourceFilterClear />);

    await user.click(screen.getByRole('button', { name: /resetFilters/i }));

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/classrooms?limit=20&view=grid'
    );
  });
});
