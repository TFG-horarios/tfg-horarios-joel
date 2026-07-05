import { notFound } from 'next/navigation';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { ReservationPlanner } from '@/features/classroom-reservation/components/reservation-planner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type OrganizationNewReservationPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
};

export default async function OrganizationNewReservationPage({
  params,
}: OrganizationNewReservationPageProps) {
  const { id, academicYearId } = await params;
  const t = await getTranslations('Organizations.classroomReservations');

  const [organization, classrooms, academicYears] = await Promise.all([
    fetchOrganizationById(id),
    fetchAllClassrooms(id, academicYearId),
    fetchAcademicYears(id),
  ]);

  if (!organization) {
    notFound();
  }

  const academicYear = academicYears.find((ay) => ay.id === academicYearId);
  if (!academicYear) {
    notFound();
  }

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('newPage.title')}
      description={t('newPage.description')}
    >
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          <Link
            href={`/organizations/${id}/academic-years/${academicYearId}/classroom-reservations`}
          >
            <ArrowLeft className="mr-2 size-4" />
            {t('newPage.back')}
          </Link>
        </Button>
      </div>

      <ReservationPlanner
        organization={organization}
        classrooms={classrooms}
        academicYear={academicYear}
      />
    </OrganizationSectionShell>
  );
}
