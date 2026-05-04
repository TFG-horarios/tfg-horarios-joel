'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/use-auth-store';
import { logoutAction } from '@/features/auth/actions';
import type { User } from '@/types/user';

export type NavItem = {
  label: string;
  href: string;
  icon: 'dashboard' | 'building' | 'calendar' | 'users' | 'settings';
  active: boolean;
};

type SidebarProps = {
  navItems: NavItem[];
  initialUser?: User | null;
};

export function Sidebar({ navItems, initialUser = null }: SidebarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionUser = mounted ? user : initialUser;
  const sessionIsLoggedIn = mounted ? isLoggedIn : !!initialUser;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await logoutAction();
    router.push('/');
    router.refresh();
  };

  const navIcons: Record<NavItem['icon'], LucideIcon> = {
    dashboard: LayoutDashboard,
    building: Building2,
    calendar: CalendarDays,
    users: Users,
    settings: Settings2,
  };

  return (
    <aside className="relative flex w-full shrink-0 flex-col rounded-xl border border-white/60 bg-white/85 p-4 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85 dark:shadow-black/20 lg:w-64">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 pr-14 dark:border-zinc-800/80 lg:flex-col lg:items-start lg:pr-0">
        <div className="mt-2">
          <Link
            href={'/organizations'}
            className="rounded-lg px-3 py-2 text-md font-semibold tracking-tight text-zinc-900 transition-colors hover:bg-violet-600 dark:text-zinc-100 dark:hover:bg-violet-900"
          >
            TFG Horarios
          </Link>
        </div>
      </div>

      <nav className="mt-4 space-y-2" aria-label="Navegación contextual">
        {navItems.map((item) => {
          const Icon = navIcons[item.icon] ?? GraduationCap;

          return (
            <Button
              key={item.href}
              asChild
              variant={item.active ? 'default' : 'outline'}
              className={cn(
                'h-11 w-full justify-start gap-3 px-4',
                item.active && 'shadow-sm'
              )}
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
          {sessionIsLoggedIn && sessionUser && (
            <div className="mt-4 space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80 lg:mt-auto lg:flex lg:flex-col lg:gap-2">
              {sessionUser ? (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/70 text-center">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {sessionUser.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {sessionUser.email}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3 px-4"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
