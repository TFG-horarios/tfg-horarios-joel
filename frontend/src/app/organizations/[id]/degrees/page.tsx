import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchDegrees } from '@/features/degree/queries';
import { DegreeCard } from '@/features/degree/components/degree-card';
import { DegreeActions } from '@/features/degree/components/degree-actions';

type OrganizationDegreesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationDegreesPage({
  params,
}: OrganizationDegreesPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.degrees');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const degrees = await fetchDegrees(id);
  const translations = {
    empty: t('empty'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={degrees.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
        <DegreeActions organizationId={id} />
      </div>
      <ResourceGrid
        items={degrees}
        renderItem={(degree) => (
          <DegreeCard degree={degree} translations={translations} />
        )}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(degree) => degree.id}
      />
    </OrganizationSectionShell>
  );
}
