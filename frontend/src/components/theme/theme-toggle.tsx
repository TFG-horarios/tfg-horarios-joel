'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Common.actions');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex h-9 w-[76px] items-center justify-between rounded-lg border border-border bg-card dark:border-border dark:bg-input/30 px-2 py-1"
        aria-hidden="true"
      />
    );
  }

  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card dark:border-border dark:bg-input/30 px-2 py-1">
      <Sun
        className={`size-4 transition-colors duration-200 ${
          !isDarkTheme
            ? 'text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]'
            : 'text-muted-foreground/45'
        }`}
      />
      <Switch
        id="theme-switch"
        checked={isDarkTheme}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label={t('toggleTheme')}
        size="sm"
        className="cursor-pointer"
      />
      <Moon
        className={`size-4 transition-colors duration-200 ${
          isDarkTheme
            ? 'text-indigo-400 dark:text-indigo-300 drop-shadow-[0_0_4px_rgba(129,140,248,0.4)]'
            : 'text-muted-foreground/45'
        }`}
      />
    </div>
  );
}
