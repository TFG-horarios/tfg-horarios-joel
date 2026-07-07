import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  mockRouterRefresh,
  mockRouterReplace,
  setNavigationMocks,
} from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourceViewToggle } from './resource-view-toggle';

describe('ResourceViewToggle', () => {
  it('stores the selected view and removes view and page query params', async () => {
    setNavigationMocks({
      pathname: '/subjects',
      searchParams: 'view=table&page=3&q=math',
    });
    const { user } = renderWithUser(
      <ResourceViewToggle viewKey="subjects-view" />
    );

    await user.click(screen.getByTitle('Vista en cuadrícula'));

    expect(document.cookie).toContain('subjects-view=grid');
    expect(mockRouterReplace).toHaveBeenCalledWith('/subjects?q=math', {
      scroll: false,
    });
    expect(mockRouterRefresh).toHaveBeenCalledOnce();
  });
});
