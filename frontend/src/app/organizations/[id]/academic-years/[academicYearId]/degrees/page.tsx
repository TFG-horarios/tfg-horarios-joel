import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchPaginatedDegrees } from '@/features/degree/queries';
import { DegreeCard } from '@/features/degree/components/degree-card';
import { DegreeActions } from '@/features/degree/components/degree-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { DegreeRow } from '@/features/degree/components/degree-row';
import { fetchPaginatedDegreesAction } from '@/features/degree/actions';
import type { DegreeListQueryDTO } from '@tfg-horarios/shared';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { parsePositiveIntParam } from '@/lib/utils/search-params';

type OrganizationDegreesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationDegreesPage({
  params,
  searchParams,
}: OrganizationDegreesPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-degrees')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = parsePositiveIntParam(limitCookie, 8) ?? 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: DegreeListQueryDTO & { view?: string } = {
    view: currentView,
    page: parsePositiveIntParam(rawSearchParams.page, 1) ?? 1,
    limit:
      parsePositiveIntParam(rawSearchParams.limit) ??
      (currentView === 'table' ? defaultTableLimit : 12),
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    code:
      typeof rawSearchParams.code === 'string'
        ? rawSearchParams.code
        : undefined,
  };

  const t = await getTranslations('Organizations.degrees');

  const [organization, { data: degrees, meta }, user] = await Promise.all([
    fetchOrganizationById(id),
    fetchPaginatedDegrees(id, query),
    getSessionUser(),
  ]);

  const memberRole = user ? await getOrganizationMemberRole(id) : null;
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
      <ResourceToolbar
        viewToggle={
          <ResourceViewToggle
            viewKey="view-degrees"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        search={
          <ResourceSearch
            placeholder={t('searchPlaceholder') || 'Buscar grado...'}
          />
        }
        filters={
          <>
            <ResourceFilterInput
              paramKey="code"
              type="text"
              placeholder={t('codePlaceholder') || 'Código...'}
            />
            <ResourceFilterClear />
          </>
        }
        actions={
          <DegreeActions
            organizationId={id}
            canCreate={canCreate}
            canDeleteAll={canDeleteAll}
            canImport={canImport}
            canReplaceAll={canReplaceAll}
          />
        }
      />
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={degrees}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedDegreesAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={DegreeCard}
          gridItemProps={{ translations, canEdit, canDelete }}
          tableHeaders={[
            'Nombre',
            'Código',
            ...(canEdit || canDelete ? ['Acciones'] : []),
          ]}
          TableRowComponent={DegreeRow}
          tableRowProps={{ translations, canEdit, canDelete }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
