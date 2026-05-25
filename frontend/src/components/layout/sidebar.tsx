'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/features/auth/actions';
import type { UserDTO } from '@tfg-horarios/shared';
import { useSession } from '../providers/session-provider';

export type NavItem = {
  label: string;
  href: string;
  icon:
    | 'dashboard'
    | 'classroom'
    | 'degree'
    | 'itinerary'
    | 'subject'
    | 'subjectGroup'
    | 'members';
  exact?: boolean;
};

type SidebarProps = {
  navItems: NavItem[];
  initialUser?: UserDTO | null;
};

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations('Common.actions');
  const tCommon = useTranslations('Common.navigation');
  const tBrand = useTranslations('Common');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  const navIcons: Record<NavItem['icon'], LucideIcon> = {
    dashboard: LayoutDashboard,
    classroom: Building2,
    degree: GraduationCap,
    itinerary: CalendarDays,
    subject: BookOpen,
    subjectGroup: Users,
    members: Users,
  };

  return (
    <aside className="relative flex w-full shrink-0 flex-col rounded-lg border border-border bg-sidebar p-4 shadow-card-light dark:shadow-none dark:border-border lg:w-64">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border pb-4 pr-14 dark:border-border lg:flex-col lg:items-start lg:pr-0">
        <div className="mt-2">
          <Link
            href={'/organizations'}
            className="rounded-lg px-3 py-2 text-md font-semibold tracking-tight text-foreground transition-colors hover:bg-primary hover:text-primary-foreground dark:text-foreground dark:hover:bg-primary"
          >
            {tBrand('brand')}
          </Link>
        </div>
      </div>

      <nav className="mt-4 space-y-2" aria-label={tCommon('contextual')}>
        {navItems.map((item) => {
          const Icon = navIcons[item.icon] ?? GraduationCap;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'default' : 'outline'}
              className={cn('h-11 w-full justify-start gap-3 px-4')}
            >
              <Link href={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      {!isLoggingOut && (
        <>
          {isAuthenticated && user && (
            <div className="mt-4 space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80 lg:mt-auto lg:flex lg:flex-col lg:gap-2">
              {user ? (
                <div className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted text-center">
                  <p className="text-sm font-medium text-foreground dark:text-foreground">
                    {user.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3 px-4 border-destructive text-destructive hover:bg-destructive/10 dark:border-destructive dark:text-destructive dark:hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                {t('signOut')}
              </Button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
