import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchOrganizations } from '@/features/organizations/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { AcademicYearsDashboard } from '@/features/academic-year/components/academic-years-dashboard';

type OrganizationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;
  const [organizations, academicYears, user] = await Promise.all([
    fetchOrganizations(),
    fetchAcademicYears(id),
    getSessionUser(),
  ]);
  const organization = organizations.find((item) => item.id === id);

  const memberRole = user ? await getOrganizationMemberRole(id, user.id) : null;
  const isAdmin = memberRole === 'admin';

  if (!organization) {
    notFound();
  }

  return (
    <Suspense>
      <AcademicYearsDashboard
        initialAcademicYears={academicYears}
        isAdmin={isAdmin}
        organization={organization}
      />
    </Suspense>
  );
}
