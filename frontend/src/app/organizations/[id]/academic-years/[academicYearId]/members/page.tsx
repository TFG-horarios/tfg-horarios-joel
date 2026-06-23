import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import {
  getOrganizationMemberRole,
  fetchPaginatedMembers,
} from '@/features/members/queries';
import { MemberCard } from '@/features/members/components/member-card';
import { MemberActions } from '@/features/members/components/member-actions';
import { MemberRow } from '@/features/members/components/member-row';
import { fetchPaginatedMembersAction } from '@/features/members/actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import type { MemberListQueryDTO } from '@tfg-horarios/shared';

type OrganizationMembersPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationMembersPage({
  params,
  searchParams,
}: OrganizationMembersPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-members')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: MemberListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
    name:
      typeof rawSearchParams.name === 'string'
        ? rawSearchParams.name
        : undefined,
    email:
      typeof rawSearchParams.email === 'string'
        ? rawSearchParams.email
        : undefined,
    role:
      typeof rawSearchParams.role === 'string' &&
      (rawSearchParams.role === 'admin' ||
        rawSearchParams.role === 'editor' ||
        rawSearchParams.role === 'viewer')
        ? rawSearchParams.role
        : undefined,
  };

  const t = await getTranslations('Organizations.members');
  const tm = await getTranslations('Organizations.membersManagement');

  const [organization, sessionUser, { data: members, meta }] =
    await Promise.all([
      fetchOrganizationById(id),
      getSessionUser(),
      fetchPaginatedMembers(id, query),
    ]);

  if (!organization || !sessionUser) {
    notFound();
  }

  const role = await getOrganizationMemberRole(id, sessionUser.id);
  if (!role || role === 'viewer') {
    notFound();
  }
  const canManage = role === 'admin';

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={canManage ? t('description.admin') : t('description.viewer')}
      count={meta.total}
      countLabel={t('countLabel')}
    >
      <ResourceToolbar
        viewToggle={
          <ResourceViewToggle
            viewKey="view-members"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        search={
          <ResourceSearch
            paramKey="name"
            placeholder={t('namePlaceholder')}
          />
        }
        filters={
          <>
            <ResourceFilterInput
              paramKey="email"
              placeholder={t('emailPlaceholder')}
            />
            <ResourceFilterSelect
              paramKey="role"
              placeholder={t('rolePlaceholder')}
              options={[
                { label: tm('roleOptions.admin'), value: 'admin' },
                { label: tm('roleOptions.editor'), value: 'editor' },
                { label: tm('roleOptions.viewer'), value: 'viewer' },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
        actions={<MemberActions organizationId={id} canManage={canManage} />}
      />
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={members}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedMembersAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={MemberCard}
          gridItemProps={{
            organizationId: id,
            currentUserId: sessionUser.id,
            canManage,
          }}
          tableHeaders={[
            'Nombre',
            'Correo',
            'Rol',
            ...(canManage ? ['Acciones'] : []),
          ]}
          TableRowComponent={MemberRow}
          tableRowProps={{
            organizationId: id,
            currentUserId: sessionUser.id,
            canManage,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
