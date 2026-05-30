import { OrganizationsDashboard } from '@/features/organizations/components/organizations-dashboard';
import { fetchOrganizations } from '@/features/organizations/queries';

export default async function OrganizationsPage() {
  const organizations = await fetchOrganizations();

  return <OrganizationsDashboard initialOrganizations={organizations} />;
}
