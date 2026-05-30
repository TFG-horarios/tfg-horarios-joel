import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassrooms } from '@/features/classroom/queries';
import { ClassroomBrowser } from '@/features/classroom/components/classroom-browser';

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
    empty: t('empty'),
    filteredEmpty: t('filteredEmpty'),
    searchLabel: t('searchLabel'),
    searchPlaceholder: t('searchPlaceholder'),
    typeFilterLabel: t('typeFilterLabel'),
    allTypes: t('allTypes'),
    capacityMinLabel: t('capacityMinLabel'),
    capacityMaxLabel: t('capacityMaxLabel'),
    resetFilters: t('resetFilters'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={classrooms.length}
      countLabel={t('countLabel')}
    >
      <ClassroomBrowser
        organizationId={id}
        classrooms={classrooms}
        translations={translations}
      />
    </OrganizationSectionShell>
  );
}
