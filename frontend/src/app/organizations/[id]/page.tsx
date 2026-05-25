import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchOrganizations } from '@/features/organizations/queries';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';

type OrganizationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.detail');
  const tForms = await getTranslations('Organizations.form.periodType.options');
  const organizations = await fetchOrganizations();
  const organization = organizations.find((item) => item.id === id);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={organizationHoverCardClassName}>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>{t('periodType')}</CardDescription>
            <CardTitle
              className={`text-lg ${organizationHoverCardTitleClassName}`}
            >
              {tForms(
                organization.periodType as 'semester' | 'trimester' | 'annual'
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={organizationHoverCardClassName}>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>{t('morning')}</CardDescription>
            <CardTitle
              className={`text-lg ${organizationHoverCardTitleClassName}`}
            >
              {organization.morningStart} - {organization.morningEnd}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={organizationHoverCardClassName}>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>{t('afternoon')}</CardDescription>
            <CardTitle
              className={`text-lg ${organizationHoverCardTitleClassName}`}
            >
              {organization.afternoonStart} - {organization.afternoonEnd}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={organizationHoverCardClassName}>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>{t('slotDuration')}</CardDescription>
            <CardTitle
              className={`text-lg ${organizationHoverCardTitleClassName}`}
            >
              {organization.slotDurationMinutes} min
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </OrganizationSectionShell>
  );
}
