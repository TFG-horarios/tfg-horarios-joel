'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/features/auth/actions';
import { useSession } from '../providers/session-provider';

interface HeaderProps {
  variant?: 'floating' | 'inline';
}

export function Header({ variant = 'inline' }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations('Common.actions');
  const tBrand = useTranslations('Common');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  const logoHref = isAuthenticated ? '/organizations' : '/';

  const baseHeaderStyles =
    'border border-border bg-card p-2 shadow-card-light dark:shadow-none transition-colors duration-300 dark:border-border dark:bg-card';

  const variantStyles = {
    floating:
      'fixed left-1/2 top-5 z-30 w-[min(92vw,780px)] -translate-x-1/2 rounded-lg',
    inline: 'rounded-lg w-full',
  };

  return (
    <header className={cn(baseHeaderStyles, variantStyles[variant])}>
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          variant === 'inline' ? 'flex-col lg:flex-row' : ''
        )}
      >
        <Link
          href={logoHref}
          className="rounded-lg px-3 py-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:bg-primary hover:text-primary-foreground dark:text-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
        >
          {tBrand('brand')}
        </Link>

        <div className="flex items-center gap-2">
          {!isLoggingOut && (
            <>
              {isAuthenticated && user && variant === 'inline' && (
                <div className="hidden rounded-lg border border-border bg-card px-4 py-2 text-right dark:border-border dark:bg-card lg:block">
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              )}

              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="h-9 px-4 gap-2 cursor-pointer border-destructive text-destructive hover:bg-destructive/10 dark:border-destructive dark:text-destructive dark:hover:bg-destructive/10"
                  onClick={handleLogout}
                  aria-label={t('signOut')}
                >
                  {variant === 'inline' && (
                    <LogOut className="size-4 hidden sm:block" />
                  )}
                  <span
                    className={variant === 'inline' ? 'hidden sm:inline' : ''}
                  >
                    {t('signOut')}
                  </span>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant={pathname === '/login' ? 'default' : 'outline'}
                    className="h-9 px-4"
                  >
                    <Link href="/login">{t('login')}</Link>
                  </Button>
                  <Button
                    asChild
                    variant={pathname === '/register' ? 'default' : 'outline'}
                    className="h-9 px-4"
                  >
                    <Link href="/register">{t('register')}</Link>
                  </Button>
                </>
              )}
            </>
          )}

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
