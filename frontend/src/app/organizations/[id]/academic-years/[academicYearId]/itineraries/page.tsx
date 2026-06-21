import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchPaginatedItineraries } from '@/features/itinerary/queries';
import { ItineraryCard } from '@/features/itinerary/components/itinerary-card';
import { ItineraryActions } from '@/features/itinerary/components/itinerary-actions';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ItineraryRow } from '@/features/itinerary/components/itinerary-row';
import { fetchPaginatedItinerariesAction } from '@/features/itinerary/actions';
import type { ItineraryListQueryDTO } from '@tfg-horarios/shared';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

type OrganizationItinerariesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationItinerariesPage({
  params,
  searchParams,
}: OrganizationItinerariesPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-itineraries')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: ItineraryListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
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

  const [organization, { data: itineraries, meta }, degrees, user] =
    await Promise.all([
      fetchOrganizationById(id),
      fetchPaginatedItineraries(id, query),
      fetchAllDegrees(id),
      getSessionUser(),
    ]);

  const memberRole = user ? await getOrganizationMemberRole(id, user.id) : null;
  const isAdmin = memberRole === 'admin';
  const isEditor = memberRole === 'editor';
  const canCreate = isAdmin || isEditor;
  const canDeleteAll = isAdmin;
  const canImport = isAdmin || isEditor;
  const canReplaceAll = isAdmin;
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin;

  if (!organization) {
    notFound();
  }
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
          viewToggle={
            <ResourceViewToggle
              viewKey="view-itineraries"
              defaultView={query.view as 'grid' | 'table'}
            />
          }
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
        <ItineraryActions
          organizationId={id}
          degrees={degrees}
          canCreate={canCreate}
          canDeleteAll={canDeleteAll}
          canImport={canImport}
          canReplaceAll={canReplaceAll}
        />
      </div>
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={itineraries}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedItinerariesAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ItineraryCard}
          gridItemProps={{ degreeMap, translations, canEdit, canDelete }}
          tableHeaders={[
            'Nombre',
            'Código',
            translations.degree,
            ...(canEdit || canDelete ? ['Acciones'] : []),
          ]}
          TableRowComponent={ItineraryRow}
          tableRowProps={{ degreeMap, translations, canEdit, canDelete }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
