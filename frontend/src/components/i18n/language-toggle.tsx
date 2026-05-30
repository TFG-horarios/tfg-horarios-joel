'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { routing } from '@/lib/i18n/routing';

export function LanguageToggle() {
  const currentLocale = useLocale();
  const router = useRouter();
  const t = useTranslations('Common.actions');
  const tLanguages = useTranslations('Common.languages');

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="language-toggle-trigger"
          variant="outline"
          size="icon"
          className="relative size-9 cursor-pointer"
          title={t('toggleLanguage')}
          aria-label={t('toggleLanguage')}
        >
          <Languages className="size-4" />
          <span className="sr-only">{t('toggleLanguage')}</span>
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none text-primary-foreground">
            {currentLocale}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-40 p-2 flex flex-col gap-1"
      >
        {routing.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={`cursor-pointer px-3 py-2 transition-colors ${
              currentLocale === locale
                ? 'bg-primary font-medium text-white hover:bg-primary hover:text-white dark:text-primary-foreground'
                : ''
            }`}
          >
            {tLanguages(locale as 'es' | 'en')}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
