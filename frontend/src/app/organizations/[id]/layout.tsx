import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Sidebar, type NavItem } from '@/components/layout/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    ...(memberRole && memberRole !== 'viewer'
      ? [
          {
            label: t('members'),
            href: `/organizations/${organization.id}/members`,
            icon: 'members',
          } as const,
        ]
      : []),
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <div className="relative z-10 flex h-full w-full flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <Sidebar navItems={navItems} />
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-card-light dark:shadow-none dark:border-border dark:bg-card">
          <ScrollArea className="h-full w-full">
            <div className="p-6 lg:p-8">{children}</div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
