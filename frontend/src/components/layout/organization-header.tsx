'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Fragment, Suspense, type ReactNode } from 'react';
import { LogOut, Search, Building2, User, X, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from '../providers/session-provider';
import { NotificationBell } from '@/features/notification/components/notification-bell';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/features/auth/actions';
import { getOrganizationNameAction } from '@/features/organizations/actions';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

function OrganizationHeaderInner() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const t = useTranslations('Common.actions');
  const tBrand = useTranslations('Common');
  const tNav = useTranslations('Organizations.navigation');
  const tProfile = useTranslations('Profile');

  const isOrganizations = pathname?.startsWith('/organizations');
  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  const isOrganizationsList = pathname === '/organizations';
  const isAcademicYearsList = isOrganizations && pathSegments.length === 2;
  const showSearch = isOrganizationsList || isAcademicYearsList;
  const isOrgDetail = isOrganizations && pathSegments.length >= 3;
  const orgId = isOrgDetail ? pathSegments[1] : null;

  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      getOrganizationNameAction(orgId).then((res) => {
        if (res.success && res.data) {
          setOrgName(res.data);
        }
      });
    } else {
      setOrgName(null);
    }
  }, [orgId]);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  return (
    <header className="relative rounded-3xl border border-border bg-white/70 p-2 text-foreground dark:bg-white/5 dark:text-white">
      {isSearchOpen && showSearch && (
        <div className="flex items-center gap-2 w-full md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(false)}
            className="shrink-0 size-9 rounded-lg"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isOrganizationsList
                  ? 'Buscar organización...'
                  : 'Buscar curso académico...'
              }
              className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border dark:bg-input/30 dark:text-white dark:placeholder:text-neutral-400"
            />
          </div>
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="shrink-0 size-9 rounded-lg"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
          isSearchOpen && showSearch && 'hidden md:flex'
        )}
      >
        <div className="flex w-full justify-center md:w-auto md:justify-start">
          <Link
            href="/organizations"
            className={cn(
              'rounded-lg px-3 p-2 text-base font-extrabold tracking-tight text-foreground transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:text-sm md:font-semibold'
            )}
          >
            {tBrand('brand')}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 md:hidden pb-2">
          {showSearch && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="relative size-9 cursor-pointer bg-card border-border dark:border-border dark:bg-input/30"
            >
              <Search className="size-4" />
            </Button>
          )}

          {isAuthenticated && <NotificationBell />}
          <LanguageToggle />
          <ThemeToggle />

          {!isLoggingOut && isAuthenticated && user && (
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

              <DropdownMenuContent
                align="end"
                className="w-56 border border-border bg-white/85 text-foreground backdrop-blur-lg dark:bg-black/60 dark:text-neutral-200"
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
        </div>

        {showSearch && (
          <div className="hidden md:absolute md:left-1/2 md:top-1/2 md:block md:w-full md:max-w-[14rem] lg:max-w-xs xl:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:px-4">
            <div>
              <label className="sr-only">Buscar organizaciones</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isOrganizationsList
                      ? 'Buscar organización...'
                      : 'Buscar curso académico...'
                  }
                  className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border dark:bg-input/30 dark:text-white dark:placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        )}

        {isOrgDetail && (
          <div className="w-full px-2 md:absolute md:left-1/2 md:top-1/2 md:w-full md:max-w-[50vw] md:-translate-x-1/2 md:-translate-y-1/2 md:px-4 lg:max-w-[60vw]">
            <div className="flex justify-center">
              <div className="flex h-9 items-center rounded-full border border-black/5 bg-black/5 px-4 shadow-inner dark:border-white/10 dark:bg-white/5 max-w-full overflow-x-auto">
                <Breadcrumb>
                  <BreadcrumbList className="flex-nowrap">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          href="/organizations"
                          className="flex items-center gap-1.5 transition-colors hover:text-brand-purple-solid"
                        >
                          <Building2 className="size-4" />
                          <span className="hidden sm:inline">
                            Organizaciones
                          </span>
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>

                    {pathSegments.slice(1).map((segment, index) => {
                      const isLast = index === pathSegments.length - 2;
                      const href =
                        '/' + pathSegments.slice(0, index + 2).join('/');
                      const realIndex = index + 1;

                      let label: ReactNode = segment;
                      if (realIndex === 1) {
                        const text =
                          orgName ||
                          (segment.length > 8
                            ? segment.substring(0, 8)
                            : segment);
                        label = (
                          <span className="inline-block max-w-25 truncate align-bottom sm:max-w-50 md:max-w-87.5">
                            {text}
                          </span>
                        );
                      } else if (realIndex === 3) {
                        label = (
                          <span className="inline-block max-w-25 truncate align-bottom">
                            {segment.length > 8
                              ? segment.substring(0, 8)
                              : segment}
                          </span>
                        );
                      } else if (realIndex === 2) {
                        const camel = segment.replace(/-([a-z])/g, (g) =>
                          g[1]!.toUpperCase()
                        );
                        const translated = tNav(camel);
                        const text = translated.includes(
                          'Organizations.navigation'
                        )
                          ? segment
                          : translated;
                        label = (
                          <span className="inline-block max-w-37.5 truncate align-bottom">
                            {text}
                          </span>
                        );
                      }

                      return (
                        <Fragment key={href}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem className="min-w-0">
                            {isLast ? (
                              <BreadcrumbPage className="truncate font-medium text-brand-purple-solid">
                                {label}
                              </BreadcrumbPage>
                            ) : segment === 'academic-years' ? (
                              <BreadcrumbLink
                                asChild
                                className="truncate transition-colors hover:text-brand-purple-solid"
                              >
                                <Link href={`/organizations/${orgId}`}>
                                  {label}
                                </Link>
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbLink
                                asChild
                                className="truncate transition-colors hover:text-brand-purple-solid"
                              >
                                <Link href={href}>{label}</Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && <NotificationBell />}
          <LanguageToggle />
          <ThemeToggle />

          {!isLoggingOut && isAuthenticated && user && (
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

              <DropdownMenuContent
                align="end"
                className="w-56 border border-border bg-white/85 text-foreground backdrop-blur-lg dark:bg-black/60 dark:text-neutral-200"
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
        </div>
      </div>
    </header>
  );
}

export function OrganizationHeader() {
  return (
    <Suspense fallback={<header className="relative rounded-3xl border border-border bg-white/70 p-2 h-[56px]"></header>}>
      <OrganizationHeaderInner />
    </Suspense>
  );
}
