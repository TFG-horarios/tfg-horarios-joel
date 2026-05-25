'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const t = useTranslations('Common.actions');

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 cursor-pointer"
      onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
      title={t('toggleTheme')}
      aria-label={t('toggleTheme')}
    >
      <Sun className="size-4 hidden dark:block" />
      <Moon className="size-4 dark:hidden" />
      <span className="sr-only">{t('toggleTheme')}</span>
    </Button>
  );
}
