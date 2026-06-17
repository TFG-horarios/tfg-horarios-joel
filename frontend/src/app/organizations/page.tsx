import { Suspense } from 'react';
import { OrganizationsDashboard } from '@/features/organizations/components/organizations-dashboard';
import { fetchOrganizations } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

export default async function OrganizationsPage() {
  const [organizations, user] = await Promise.all([
    fetchOrganizations(),
    getSessionUser(),
  ]);

  const userRolesMap: Record<string, string | null> = {};
  if (user) {
    const roles = await Promise.all(
      organizations.map((org) => getOrganizationMemberRole(org.id, user.id))
    );
    organizations.forEach((org, index) => {
      userRolesMap[org.id] = roles[index] ?? null;
    });
  }

  return (
    <Suspense>
      <OrganizationsDashboard
        initialOrganizations={organizations}
        userRolesMap={userRolesMap}
      />
    </Suspense>
  );
}
