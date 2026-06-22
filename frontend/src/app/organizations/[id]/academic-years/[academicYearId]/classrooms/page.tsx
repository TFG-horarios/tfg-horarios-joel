import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchPaginatedClassrooms } from '@/features/classroom/queries';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ClassroomActions } from '@/features/classroom/components/classroom-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ClassroomCard } from '@/features/classroom/components/classroom-card';
import { ClassroomRow } from '@/features/classroom/components/classroom-row';
import { fetchPaginatedClassroomsAction } from '@/features/classroom/actions';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

type OrganizationClassroomsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationClassroomsPage({
  params,
  searchParams,
}: OrganizationClassroomsPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-classrooms')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
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

  const [organization, { data: classrooms, meta }, user] = await Promise.all([
    fetchOrganizationById(id),
    fetchPaginatedClassrooms(id, query),
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
  const translations = {
    'type.theory': t('type.theory'),
    'type.lab': t('type.lab'),
    capacity: t('capacity'),
    floor: t('floor'),
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
          viewToggle={
            <ResourceViewToggle
              viewKey="view-classrooms"
              defaultView={query.view as 'grid' | 'table'}
            />
          }
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
        <ClassroomActions
          organizationId={id}
          canCreate={canCreate}
          canDeleteAll={canDeleteAll}
          canImport={canImport}
          canReplaceAll={canReplaceAll}
        />
      </div>
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={classrooms}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedClassroomsAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ClassroomCard}
          gridItemProps={{ translations, canEdit, canDelete }}
          tableHeaders={[
            'Nombre',
            'Tipo',
            t('floor'),
            'Capacidad',
            ...(canEdit || canDelete ? ['Acciones'] : []),
          ]}
          TableRowComponent={ClassroomRow}
          tableRowProps={{ translations, canEdit, canDelete }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
