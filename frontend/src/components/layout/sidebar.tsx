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
  Users,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  backUrl?: string;
  backLabel?: string;
};

export function Sidebar({ navItems, backUrl, backLabel }: SidebarProps) {
  const pathname = usePathname();
  const tCommon = useTranslations('Common');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  let defaultBackUrl: string | undefined;
  let defaultBackLabel: string | undefined;

  if (segments.length > 1) {
    if (segments.length === 3 && segments[0] === 'organizations') {
      defaultBackUrl = `/${segments[0]}`;
    } else if (
      segments.length === 4 &&
      segments[0] === 'organizations' &&
      segments[2] === 'academic-years'
    ) {
      defaultBackUrl = `/organizations/${segments[1]}`;
    } else {
      defaultBackUrl = `/${segments.slice(0, -1).join('/')}`;
    }
    defaultBackLabel = tCommon('actions.back');
  }

  const finalBackUrl = backUrl || defaultBackUrl;
  const finalBackLabel = backLabel || defaultBackLabel;

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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative z-20 flex shrink-0 flex-col rounded-3xl border border-border bg-white/70 py-8 transition-all duration-300 dark:bg-white/5',
          isCollapsed ? 'w-[88px] px-2' : 'w-full px-4 lg:w-[260px]'
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsCollapsed((prev) => !prev);
          }}
          className="cursor-pointer absolute -right-[22px] top-1/2 z-50 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-md transition-colors hover:bg-gray-100 hover:text-foreground dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
        <nav
          className="flex h-full flex-1 flex-col justify-between"
          aria-label={tCommon('navigation.contextual')}
        >
          {finalBackUrl && finalBackLabel && (
            <div className="border-b border-border pb-6">
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-11 w-full justify-center whitespace-nowrap px-0 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <Link href={finalBackUrl}>
                        <ArrowLeft className="size-4 shrink-0" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16}>
                    {finalBackLabel}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 w-full justify-start gap-3 whitespace-nowrap px-4 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <Link href={finalBackUrl}>
                    <ArrowLeft className="size-4 shrink-0" />
                    <span>{finalBackLabel}</span>
                  </Link>
                </Button>
              )}
            </div>
          )}
          {navItems.map((item) => {
            const Icon = navIcons[item.icon] ?? GraduationCap;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const buttonContent = (
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'h-11 w-full whitespace-nowrap text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white',
                  isCollapsed
                    ? 'justify-center px-0'
                    : 'justify-start gap-3 px-4',
                  isActive
                    ? 'border border-purple-500/40 bg-purple-500/15 text-purple-700 shadow-lg shadow-black/10 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 dark:shadow-black/40'
                    : ''
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            );

            return isCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={16}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{buttonContent}</div>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
