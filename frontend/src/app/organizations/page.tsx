import { Header } from '@/components/layout/header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrganizationsDashboard } from '@/features/organizations/components/organizations-dashboard';
import { getSessionUser } from '@/features/auth/actions';
import { fetchOrganizations } from '@/features/organizations/actions';

export default async function OrganizationsPage() {
  const user = await getSessionUser();
  const organizations = await fetchOrganizations();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 p-2 lg:p-4">
      <div className="shrink-0">
        <Header variant="inline" initialUser={user} />
      </div>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/60 bg-white/85 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85 dark:shadow-black/20">
        <ScrollArea className="h-full min-h-0 w-full">
          <div className="h-full min-h-0 p-6 lg:p-8">
            <OrganizationsDashboard initialOrganizations={organizations} />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
