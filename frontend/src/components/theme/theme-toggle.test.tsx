import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import { ThemeToggle } from './theme-toggle';

const setTheme = vi.fn<(theme: string) => void>();
let resolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme,
    setTheme,
  }),
}));

describe('ThemeToggle', () => {
  it('toggles between light and dark themes after mounting', async () => {
    resolvedTheme = 'light';
    const { user } = renderWithUser(<ThemeToggle />);

    const toggle = await screen.findByRole('switch', {
      name: 'toggleTheme',
    });

    await user.click(toggle);

    await waitFor(() => {
      expect(setTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('switches dark themes back to light', async () => {
    resolvedTheme = 'dark';
    const { user } = renderWithUser(<ThemeToggle />);

    await user.click(await screen.findByRole('switch', {
      name: 'toggleTheme',
    }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
