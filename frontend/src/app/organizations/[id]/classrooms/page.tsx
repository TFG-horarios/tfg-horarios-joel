import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassrooms } from '@/features/classroom/queries';
import { ClassroomCard } from '@/features/classroom/components/classroom-card';
import { ClassroomActions } from '@/features/classroom/components/classroom-actions';

type OrganizationClassroomsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationClassroomsPage({
  params,
}: OrganizationClassroomsPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.classrooms');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const classrooms = await fetchClassrooms(id);
  const translations = {
    'type.theory': t('type.theory'),
    'type.lab': t('type.lab'),
    capacity: t('capacity'),
    organization: t('organization'),
    empty: t('empty'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={classrooms.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
        <ClassroomActions organizationId={id} existingClassrooms={classrooms} />
      </div>
      <ResourceGrid
        items={classrooms}
        renderItem={(classroom) => (
          <ClassroomCard
            classroom={classroom}
            organizationName={organization.name}
            translations={translations}
          />
        )}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(classroom) => classroom.id}
      />
    </OrganizationSectionShell>
  );
}
