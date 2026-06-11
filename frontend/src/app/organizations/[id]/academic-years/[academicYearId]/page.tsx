import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchOrganizationById } from '@/features/organizations/queries';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type AcademicYearPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
};

export default async function AcademicYearSummaryPage({
  params,
}: AcademicYearPageProps) {
  const { id, academicYearId } = await params;
  const tOrg = await getTranslations('Organizations.detail');
  const tForms = await getTranslations('Organizations.form.periodType.options');
  const tNav = await getTranslations('Organizations.navigation');
  const statusTranslations = await getTranslations('Common.status');

  const [organization, academicYears] = await Promise.all([
    fetchOrganizationById(id),
    fetchAcademicYears(id),
  ]);

  const academicYear = academicYears.find((ay) => ay.id === academicYearId);

  if (!organization || !academicYear) {
    notFound();
  }

  return (
    <OrganizationSectionShell
      label={tNav('summary')}
      title={academicYear.name}
      description={`Resumen de la organización y el curso académico ${academicYear.name}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-bold tracking-tight">Estado del Curso</h2>
        <Badge
          variant={academicYear.isActive ? 'default' : 'secondary'}
          className="text-sm px-3 py-1"
        >
          {academicYear.isActive
            ? statusTranslations('active')
            : statusTranslations('inactive')}
        </Badge>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Configuración de la Organización
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className={organizationHoverCardClassName}>
              <CardHeader className="space-y-1 p-5">
                <CardDescription>{tOrg('periodType')}</CardDescription>
                <CardTitle
                  className={`text-lg ${organizationHoverCardTitleClassName}`}
                >
                  {tForms(
                    organization.periodType as
                      | 'semester'
                      | 'trimester'
                      | 'annual'
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className={organizationHoverCardClassName}>
              <CardHeader className="space-y-1 p-5">
                <CardDescription>{tOrg('morning')}</CardDescription>
                <CardTitle
                  className={`text-lg ${organizationHoverCardTitleClassName}`}
                >
                  {organization.morningStart} - {organization.morningEnd}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className={organizationHoverCardClassName}>
              <CardHeader className="space-y-1 p-5">
                <CardDescription>{tOrg('afternoon')}</CardDescription>
                <CardTitle
                  className={`text-lg ${organizationHoverCardTitleClassName}`}
                >
                  {organization.afternoonStart} - {organization.afternoonEnd}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className={organizationHoverCardClassName}>
              <CardHeader className="space-y-1 p-5">
                <CardDescription>{tOrg('slotDuration')}</CardDescription>
                <CardTitle
                  className={`text-lg ${organizationHoverCardTitleClassName}`}
                >
                  {organization.slotDurationMinutes} min
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Períodos Lectivos</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {academicYear.period0Start && academicYear.period0End && (
              <Card className={organizationHoverCardClassName}>
                <CardHeader className="space-y-1 p-5">
                  <CardDescription>Período 1</CardDescription>
                  <CardTitle
                    className={`text-lg ${organizationHoverCardTitleClassName}`}
                  >
                    {format(new Date(academicYear.period0Start), 'dd/MM/yyyy')}{' '}
                    - {format(new Date(academicYear.period0End), 'dd/MM/yyyy')}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {academicYear.period1Start && academicYear.period1End && (
              <Card className={organizationHoverCardClassName}>
                <CardHeader className="space-y-1 p-5">
                  <CardDescription>Período 2</CardDescription>
                  <CardTitle
                    className={`text-lg ${organizationHoverCardTitleClassName}`}
                  >
                    {format(new Date(academicYear.period1Start), 'dd/MM/yyyy')}{' '}
                    - {format(new Date(academicYear.period1End), 'dd/MM/yyyy')}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {academicYear.period2Start && academicYear.period2End && (
              <Card className={organizationHoverCardClassName}>
                <CardHeader className="space-y-1 p-5">
                  <CardDescription>Período 3</CardDescription>
                  <CardTitle
                    className={`text-lg ${organizationHoverCardTitleClassName}`}
                  >
                    {format(new Date(academicYear.period2Start), 'dd/MM/yyyy')}{' '}
                    - {format(new Date(academicYear.period2End), 'dd/MM/yyyy')}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </OrganizationSectionShell>
  );
}
