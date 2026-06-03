import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Sidebar, type NavItem } from '@/components/layout/sidebar';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { fetchOrganizationById } from '@/features/organizations/queries';

type OrganizationLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const id = (await params).id;
  const t = await getTranslations('Organizations.navigation');

  const [user, organization] = await Promise.all([
    getSessionUser(),
    fetchOrganizationById(id),
  ]);

  if (!organization) {
    notFound();
  }

  const memberRole = user ? await getOrganizationMemberRole(id, user.id) : null;

  const navItems: NavItem[] = [
    {
      label: t('summary'),
      href: `/organizations/${organization.id}`,
      icon: 'dashboard',
      exact: true,
    },
    {
      label: t('classrooms'),
      href: `/organizations/${organization.id}/classrooms`,
      icon: 'classroom',
    },
    {
      label: t('degrees'),
      href: `/organizations/${organization.id}/degrees`,
      icon: 'degree',
    },
    {
      label: t('itineraries'),
      href: `/organizations/${organization.id}/itineraries`,
      icon: 'itinerary',
    },
    {
      label: t('subjects'),
      href: `/organizations/${organization.id}/subjects`,
      icon: 'subject',
    },
    {
      label: t('subjectGroups'),
      href: `/organizations/${organization.id}/subject-groups`,
      icon: 'subjectGroup',
    },
    {
      label: t('schedules'),
      href: `/organizations/${organization.id}/schedules`,
      icon: 'schedules',
    },
    ...(memberRole && memberRole !== 'viewer'
      ? [
          {
            label: t('members'),
            href: `/organizations/${organization.id}/members`,
            icon: 'members',
          } as const,
        ]
      : []),
    {
      label: t('classroomSchedules'),
      href: `/organizations/${organization.id}/classroom-schedules`,
      icon: 'classroomSchedules',
    },
    {
      label: t('reserve'),
      href: `/organizations/${organization.id}/reserve`,
      icon: 'reserve',
    },
  ];

  return (
    <div className="relative z-10 flex h-full w-full min-h-0 flex-col gap-2 lg:flex-row lg:gap-3">
      <Sidebar navItems={navItems} />
      <main className="p-6 lg:p-8 h-full w-full overflow-y-auto hide-scrollbar relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/5">
        {children}
      </main>
    </div>
  );
}
