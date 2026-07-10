'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LogOut, Search, User } from 'lucide-react';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils/styles';
import { logoutAction } from '@/features/auth/actions';
import { useSession } from '../providers/session-provider';
import { NotificationBell } from '@/features/notification/components/notification-bell';

interface HeaderProps {
  variant?: 'floating' | 'inline';
}

export function Header({ variant = 'inline' }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations('Common.actions');
  const tProfile = useTranslations('Profile');
  const tSearch = useTranslations('Common.search');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  const logoHref = isAuthenticated ? '/organizations' : '/';
  const isOrganizations = pathname?.startsWith('/organizations');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const lastPushedQ = useRef(searchParams.get('q') ?? '');

  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (currentQ !== lastPushedQ.current) {
      setQuery(currentQ);
      lastPushedQ.current = currentQ;
    }
  }, [searchParams]);

  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (query !== currentQ) {
      const handler = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set('q', query);
        } else {
          params.delete('q');
        }
        lastPushedQ.current = query;
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }, 200);
      return () => clearTimeout(handler);
    }
  }, [query, pathname, router, searchParams]);

  const baseHeaderStyles =
    'rounded-3xl border border-border bg-white/70 px-4 py-2 backdrop-blur-lg transition-colors duration-300 text-foreground dark:bg-white/5 dark:text-white dark:shadow-black/60';

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
          className="rounded-lg px-3 py-2 text-lg font-bold tracking-tight text-foreground transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          Sk<span className="text-brand-purple-solid">Edu</span>
        </Link>
        {isOrganizations && variant === 'inline' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4 pointer-events-none">
            <div className="pointer-events-auto">
              <label className="sr-only">{tSearch('organizationsLabel')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tSearch('organizationsPlaceholder')}
                  className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border dark:bg-input/30 dark:text-white dark:placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        )}

        {pathname === '/profile' && variant === 'inline' && (
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4 pointer-events-none">
            <div className="pointer-events-auto flex justify-center">
              <div className="flex h-9 items-center rounded-full border border-black/5 bg-black/5 px-4 shadow-inner dark:border-white/10 dark:bg-white/5">
                <Breadcrumb>
                  <BreadcrumbList className="flex-nowrap">
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-brand-purple-solid">
                        <div className="flex items-center gap-1.5">
                          <User className="size-4" />
                          <span>{tProfile('title')}</span>
                        </div>
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {!isLoggingOut && (
            <>
              {isAuthenticated && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t('signOut')}
                      className="relative size-9 cursor-pointer rounded-full bg-card border-border dark:border-border dark:bg-input/30 text-sm font-medium"
                    >
                      {(user.name || user.email)?.charAt(0).toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">
                        {user.name ?? ''}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground dark:text-neutral-300">
                        {user.email}
                      </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full cursor-pointer">
                        <User className="mr-2 size-4" />
                        {tProfile('title')}
                      </Link>
                    </DropdownMenuItem>

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
                    variant="outline"
                    className={cn(
                      'hidden md:inline-flex h-9 px-4',
                      pathname === '/login'
                        ? 'border-brand-purple-border bg-brand-purple-bg text-brand-purple hover:bg-brand-purple-hover hover:text-brand-purple shadow-sm dark:bg-brand-purple-bg dark:border-brand-purple-border dark:text-brand-purple dark:hover:bg-brand-purple-hover dark:hover:text-brand-purple'
                        : 'border border-border bg-card text-foreground dark:border-border dark:bg-input/30'
                    )}
                  >
                    <Link href="/login">{t('login')}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      'hidden md:inline-flex h-9 px-4',
                      pathname === '/register'
                        ? 'border-brand-purple-border bg-brand-purple-bg text-brand-purple hover:bg-brand-purple-hover hover:text-brand-purple shadow-sm dark:bg-brand-purple-bg dark:border-brand-purple-border dark:text-brand-purple dark:hover:bg-brand-purple-hover dark:hover:text-brand-purple'
                        : 'border border-border bg-card text-foreground dark:border-border dark:bg-input/30'
                    )}
                  >
                    <Link href="/register">{t('register')}</Link>
                  </Button>
                </>
              )}
            </>
          )}

          {isAuthenticated && <NotificationBell />}

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
