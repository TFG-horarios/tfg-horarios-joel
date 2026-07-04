import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Sidebar, type NavItem } from '@/components/layout/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { fetchOrganizationById } from '@/features/organizations/queries';

type OrganizationLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string; academicYearId: string }>;
};

export default async function AcademicYearLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { id, academicYearId } = await params;
  const t = await getTranslations('Organizations.navigation');

  const [user, organization] = await Promise.all([
    getSessionUser(),
    fetchOrganizationById(id),
  ]);

  if (!organization) {
    notFound();
  }

  const memberRole = user ? await getOrganizationMemberRole(id, user.id) : null;
  const basePath = `/organizations/${organization.id}/academic-years/${academicYearId}`;

  const navItems: NavItem[] = [
    {
      label: t('summary'),
      href: basePath,
      icon: 'dashboard',
      exact: true,
    },
    {
      label: t('classrooms'),
      href: `${basePath}/classrooms`,
      icon: 'classroom',
    },
    {
      label: t('degrees'),
      href: `${basePath}/degrees`,
      icon: 'degree',
    },
    {
      label: t('itineraries'),
      href: `${basePath}/itineraries`,
      icon: 'itinerary',
    },
    {
      label: t('subjects'),
      href: `${basePath}/subjects`,
      icon: 'subject',
    },
    {
      label: t('subjectGroups'),
      href: `${basePath}/subject-groups`,
      icon: 'subjectGroup',
    },
    {
      label: t('schedules'),
      href: `${basePath}/schedules`,
      icon: 'schedules',
    },
    {
      label: t('classroomSchedules'),
      href: `${basePath}/classroom-schedules`,
      icon: 'classroomSchedules',
    },
    ...(memberRole && memberRole !== 'viewer'
      ? [
          {
            label: t('timeConfigs'),
            href: `${basePath}/time-configs`,
            icon: 'timeConfigs',
          } as const,
          {
            label: t('members'),
            href: `${basePath}/members`,
            icon: 'members',
          } as const,
        ]
      : []),
    {
      label: t('reserve'),
      href: `${basePath}/classroom-reservations`,
      icon: 'reserve',
    },
  ];

  return (
    <div className="relative z-10 flex h-full w-full min-h-0 flex-col gap-2 lg:flex-row lg:gap-3">
      <Sidebar navItems={navItems} />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-border bg-white/70 dark:bg-white/5">
        <ScrollArea className="h-full w-full">
          <div className="p-6 lg:p-8">{children}</div>
        </ScrollArea>
      </main>
    </div>
  );
}
