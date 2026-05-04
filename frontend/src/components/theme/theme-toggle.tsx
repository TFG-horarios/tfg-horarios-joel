'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 cursor-pointer"
      onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
      title="Cambiar tema"
    >
      <Sun className="size-4 hidden dark:block" />
      <Moon className="size-4 dark:hidden" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
