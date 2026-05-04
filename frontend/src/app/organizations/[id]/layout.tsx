import { notFound } from 'next/navigation';
import { Sidebar, type NavItem } from '@/components/layout/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSessionUser } from '@/features/auth/actions';
import { AuthInitializer } from '@/features/auth/components/auth-initializer';
import { fetchOrganizations } from '@/features/organizations/actions';

type OrganizationLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const id = (await params).id;
  const user = await getSessionUser();
  const organizations = await fetchOrganizations();
  const organization = organizations.find((item) => item.id === id);

  if (!organization) {
    notFound();
  }

  const navItems: NavItem[] = [
    {
      label: 'Resumen',
      href: `/organizations/${organization.id}`,
      icon: 'building',
      active: true,
    },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <AuthInitializer user={user} />
      <div className="relative z-10 flex h-full w-full flex-col gap-4 p-2 lg:flex-row lg:p-4">
        <Sidebar navItems={navItems} initialUser={user} />
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-white/60 bg-white/85 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85 dark:shadow-black/20">
          <ScrollArea className="h-full w-full">
            <div className="p-6 lg:p-8">{children}</div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
