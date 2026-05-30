'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Search } from 'lucide-react';
import {
  useOrganizationStore,
  type OrganizationStore,
} from '@/store/use-organization-store';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const isOrganizations = pathname?.startsWith('/organizations');
  const searchQuery = useOrganizationStore(
    (s: OrganizationStore) => s.searchQuery
  );
  const setSearchQuery = useOrganizationStore(
    (s: OrganizationStore) => s.setSearchQuery
  );
  const [query, setQuery] = useState(searchQuery);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(query ?? '');
    }, 200);
    return () => clearTimeout(handler);
  }, [query, setSearchQuery]);

  const baseHeaderStyles =
    'rounded-3xl border border-black/10 bg-white/70 p-2 shadow-lg shadow-black/10 backdrop-blur-lg transition-colors duration-300 text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/60';

  const variantStyles = {
    floating: 'fixed left-1/2 top-5 z-30 w-[min(92vw,780px)] -translate-x-1/2',
    inline: 'w-full',
  };

  return (
    <header className={cn(baseHeaderStyles, variantStyles[variant])}>
      <div
        className={cn(
          'relative flex items-center justify-between gap-2',
          variant === 'inline' ? 'flex-col lg:flex-row' : ''
        )}
      >
        <Link
          href={logoHref}
          className="rounded-lg px-3 py-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          {tBrand('brand')}
        </Link>
        {isOrganizations && variant === 'inline' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4 pointer-events-none">
            <div className="pointer-events-auto">
              <label className="sr-only">Buscar organizaciones</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar organización..."
                  className="w-full rounded-lg border border-black/10 bg-white/70 px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {!isLoggingOut && (
            <>
              {isAuthenticated && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={t('signOut')}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/80 text-sm font-medium text-foreground dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      {(user.name || user.email)?.charAt(0).toUpperCase()}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-56 border border-black/10 bg-white/85 text-foreground backdrop-blur-lg dark:border-white/10 dark:bg-black/60 dark:text-neutral-200"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">
                        {user.name ?? ''}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground dark:text-neutral-300">
                        {user.email}
                      </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleLogout()}
                      data-variant="destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      {t('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!isAuthenticated && (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      'h-9 px-4 border border-black/10 bg-white/70 text-foreground hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                      pathname === '/login'
                        ? 'border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200'
                        : ''
                    )}
                  >
                    <Link href="/login">{t('login')}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      'h-9 px-4 border border-black/10 bg-white/70 text-foreground hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                      pathname === '/register'
                        ? 'border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200'
                        : ''
                    )}
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
