import { Header } from '@/components/layout/header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrganizationsDashboard } from '@/features/organizations/components/organizations-dashboard';
import { fetchOrganizations } from '@/features/organizations/queries';

export default async function OrganizationsPage() {
  const organizations = await fetchOrganizations();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="shrink-0">
        <Header variant="inline" />
      </div>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card-light dark:shadow-none dark:border-border dark:bg-card">
        <ScrollArea className="h-full min-h-0 w-full">
          <div className="h-full min-h-0 p-6 lg:p-8">
            <OrganizationsDashboard initialOrganizations={organizations} />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
