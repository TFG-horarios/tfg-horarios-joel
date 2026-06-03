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
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceInfiniteScroll } from '@/components/shared/resource/resource-infinite-scroll';
import { fetchDegreesAction } from '@/features/degree/actions';
import type { DegreeListQueryDTO } from '@tfg-horarios/shared';

type OrganizationDegreesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationDegreesPage({
  params,
  searchParams,
}: OrganizationDegreesPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const query: DegreeListQueryDTO = {
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit ? Number(rawSearchParams.limit) : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    code:
      typeof rawSearchParams.code === 'string'
        ? rawSearchParams.code
        : undefined,
  };

  const t = await getTranslations('Organizations.degrees');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const { data: degrees, meta } = await fetchDegrees(id, query);
  const translations = {
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          search={
            <ResourceSearch
              placeholder={t('searchPlaceholder') || 'Buscar grado...'}
            />
          }
          filters={
            <div className="flex gap-2 w-full lg:w-auto">
              <ResourceFilterInput
                paramKey="code"
                type="text"
                placeholder={t('codePlaceholder') || 'Código...'}
              />
              <ResourceFilterClear />
            </div>
          }
        />
        <DegreeActions organizationId={id} />
      </div>
      <div>
        <ResourceGrid emptyState={<ResourceEmptyState message={t('empty')} />}>
          {degrees.length > 0 && (
            <ResourceInfiniteScroll
              key={JSON.stringify(query)}
              initialItems={degrees}
              initialMeta={meta}
              loadMore={fetchDegreesAction.bind(null, id, query)}
              ItemComponent={DegreeCard}
              itemProps={{ translations }}
              keyProp="id"
            />
          )}
        </ResourceGrid>
      </div>
    </OrganizationSectionShell>
  );
}
