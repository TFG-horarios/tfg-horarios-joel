import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchItineraries } from '@/features/itinerary/queries';
import { ItineraryCard } from '@/features/itinerary/components/itinerary-card';
import { ItineraryActions } from '@/features/itinerary/components/itinerary-actions';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceInfiniteScroll } from '@/components/shared/resource/resource-infinite-scroll';
import { fetchItinerariesAction } from '@/features/itinerary/actions';
import type { ItineraryListQueryDTO } from '@tfg-horarios/shared';

type OrganizationItinerariesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationItinerariesPage({
  params,
  searchParams,
}: OrganizationItinerariesPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const query: ItineraryListQueryDTO = {
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit ? Number(rawSearchParams.limit) : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    code:
      typeof rawSearchParams.code === 'string'
        ? rawSearchParams.code
        : undefined,
    degreeId:
      typeof rawSearchParams.degreeId === 'string'
        ? rawSearchParams.degreeId
        : undefined,
  };

  const t = await getTranslations('Organizations.itineraries');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [{ data: itineraries, meta }, degrees] = await Promise.all([
    fetchItineraries(id, query),
    fetchAllDegrees(id),
  ]);
  const degreeMap = new Map(degrees.map((d) => [d.id, d]));
  const translations = {
    degree: t('degree'),
    unassigned: t('unassigned'),
    degreeCode: t('degreeCode'),
    noCode: t('noCode'),
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
          search={<ResourceSearch placeholder={t('searchPlaceholder')} />}
          filters={
            <div className="flex gap-2 w-full lg:w-auto">
              <ResourceFilterInput
                paramKey="code"
                type="text"
                placeholder={t('codePlaceholder')}
              />
              <ResourceFilterSelect
                paramKey="degreeId"
                placeholder={t('degreePlaceholder')}
                options={degrees.map((d) => ({ label: d.name, value: d.id }))}
              />
              <ResourceFilterClear />
            </div>
          }
        />
        <ItineraryActions organizationId={id} degrees={degrees} />
      </div>
      <div>
        <ResourceGrid emptyState={<ResourceEmptyState message={t('empty')} />}>
          {itineraries.length > 0 && (
            <ResourceInfiniteScroll
              key={JSON.stringify(query)}
              initialItems={itineraries}
              initialMeta={meta}
              loadMore={fetchItinerariesAction.bind(null, id, query)}
              ItemComponent={ItineraryCard}
              itemProps={{ degreeMap, translations }}
              keyProp="id"
            />
          )}
        </ResourceGrid>
      </div>
    </OrganizationSectionShell>
  );
}
