import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassrooms } from '@/features/classroom/queries';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ClassroomActions } from '@/features/classroom/components/classroom-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceInfiniteScroll } from '@/components/shared/resource/resource-infinite-scroll';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ClassroomCard } from '@/features/classroom/components/classroom-card';
import { fetchClassroomsAction } from '@/features/classroom/actions';

type OrganizationClassroomsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationClassroomsPage({
  params,
  searchParams,
}: OrganizationClassroomsPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const query = {
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit ? Number(rawSearchParams.limit) : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    type:
      rawSearchParams.type === 'theory' || rawSearchParams.type === 'lab'
        ? (rawSearchParams.type as 'theory' | 'lab')
        : undefined,
    minCapacity:
      typeof rawSearchParams.minCapacity === 'string'
        ? Number(rawSearchParams.minCapacity)
        : undefined,
    maxCapacity:
      typeof rawSearchParams.maxCapacity === 'string'
        ? Number(rawSearchParams.maxCapacity)
        : undefined,
  };

  const t = await getTranslations('Organizations.classrooms');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }

  const { data: classrooms, meta } = await fetchClassrooms(id, query);

  const translations = {
    'type.theory': t('type.theory'),
    'type.lab': t('type.lab'),
    capacity: t('capacity'),
    empty: t('empty'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={meta.total}
      countLabel={t('countLabel')}
    >
      <div className="flex-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          search={
            <ResourceSearch
              placeholder={t('searchPlaceholder') || 'Buscar aulas...'}
            />
          }
          filters={
            <div className="flex gap-2 w-full">
              <ResourceFilterSelect
                paramKey="type"
                placeholder={t('typeFilterLabel')}
                options={[
                  { label: t('type.theory'), value: 'theory' },
                  { label: t('type.lab'), value: 'lab' },
                ]}
              />
              <ResourceFilterInput
                paramKey="minCapacity"
                type="number"
                placeholder={t('capacityMinLabel')}
              />
              <ResourceFilterInput
                paramKey="maxCapacity"
                type="number"
                placeholder={t('capacityMaxLabel')}
              />
              <ResourceFilterClear />
            </div>
          }
        />
        <ClassroomActions organizationId={id} />
      </div>
      <div>
        <ResourceGrid emptyState={<ResourceEmptyState message={t('empty')} />}>
          {classrooms.length > 0 && (
            <ResourceInfiniteScroll
              initialItems={classrooms}
              initialMeta={meta}
              loadMore={fetchClassroomsAction.bind(null, id, query)}
              ItemComponent={ClassroomCard}
              itemProps={{ translations }}
              keyProp="id"
            />
          )}
        </ResourceGrid>
      </div>
    </OrganizationSectionShell>
  );
}
