import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  mockRouterPush,
  setNavigationMocks,
} from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceSearch } from './resource-search';

describe('ResourceSearch', () => {
  it('debounces search changes into the configured query param', async () => {
    setNavigationMocks({
      pathname: '/subjects',
      searchParams: 'page=2&q=old',
    });
    const { user } = renderWithUser(
      <ResourceSearch placeholder="Search subjects" />
    );

    await user.clear(screen.getByPlaceholderText('Search subjects'));
    await user.type(screen.getByPlaceholderText('Search subjects'), 'math');

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/subjects?q=math');
    });
  });

  it('removes the filter when the input is cleared', async () => {
    setNavigationMocks({
      pathname: '/subjects',
      searchParams: 'q=math&limit=10',
    });
    const { user } = renderWithUser(
      <ResourceSearch placeholder="Search subjects" />
    );

    await user.clear(screen.getByPlaceholderText('Search subjects'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/subjects?limit=10');
    });
  });
});
