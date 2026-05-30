'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserDTO } from '@tfg-horarios/shared';

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
    | 'schedules'
    | 'members'
    | 'classroomSchedules'
    | 'reserve';
  exact?: boolean;
};

type SidebarProps = {
  navItems: NavItem[];
  initialUser?: UserDTO | null;
};

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();
  const tCommon = useTranslations('Common.navigation');

  const navIcons: Record<NavItem['icon'], LucideIcon> = {
    dashboard: LayoutDashboard,
    classroom: Building2,
    degree: GraduationCap,
    itinerary: CalendarDays,
    subject: BookOpen,
    subjectGroup: Users,
    schedules: CalendarDays,
    members: Users,
    classroomSchedules: CalendarDays,
    reserve: CalendarDays,
  };

  return (
    <aside className="relative flex w-full shrink-0 flex-col rounded-3xl border border-black/10 bg-white/70 px-4 py-8 shadow-lg shadow-black/10 backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:shadow-black/60 lg:w-max">
      <nav
        className="flex h-full flex-1 flex-col justify-between"
        aria-label={tCommon('contextual')}
      >
        {navItems.map((item) => {
          const Icon = navIcons[item.icon] ?? GraduationCap;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'h-11 w-full justify-start gap-3 whitespace-nowrap px-4 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white',
                isActive
                  ? 'border border-purple-500/40 bg-purple-500/15 text-purple-700 shadow-lg shadow-black/10 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 dark:shadow-black/40'
                  : ''
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
    </aside>
  );
}
