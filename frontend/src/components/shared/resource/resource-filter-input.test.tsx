import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  mockRouterPush,
  setNavigationMocks,
} from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceFilterInput } from './resource-filter-input';

describe('ResourceFilterInput', () => {
  it('debounces filter changes and resets pagination', async () => {
    setNavigationMocks({
      pathname: '/classrooms',
      searchParams: 'page=4&capacity=20',
    });
    const { user } = renderWithUser(
      <ResourceFilterInput paramKey="capacity" placeholder="Capacity" />
    );

    await user.clear(screen.getByPlaceholderText('Capacity'));
    await user.type(screen.getByPlaceholderText('Capacity'), '30');

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/classrooms?capacity=30');
    });
  });

  it('removes the filter when the value is cleared', async () => {
    setNavigationMocks({
      pathname: '/classrooms',
      searchParams: 'capacity=20&building=north',
    });
    const { user } = renderWithUser(
      <ResourceFilterInput paramKey="capacity" placeholder="Capacity" />
    );

    await user.clear(screen.getByPlaceholderText('Capacity'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/classrooms?building=north'
      );
    });
  });
});
