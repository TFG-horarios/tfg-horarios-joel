import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRouterRefresh } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { LanguageToggle } from './language-toggle';

describe('LanguageToggle', () => {
  it('stores the selected locale and refreshes the route', async () => {
    const { user } = renderWithUser(<LanguageToggle />);

    await user.click(screen.getByRole('button', { name: 'toggleLanguage' }));
    await user.click(screen.getByText('en'));

    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(mockRouterRefresh).toHaveBeenCalledOnce();
  });
});
