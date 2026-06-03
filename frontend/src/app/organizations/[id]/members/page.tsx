import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import {
  getOrganizationMemberContext,
  getOrganizationMemberRole,
} from '@/features/members/queries';
import { MemberCard } from '@/features/members/components/member-card';
import { MemberActions } from '@/features/members/components/member-actions';
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
  const rawSearchParams = await searchParams;
  const query: MemberListQueryDTO = {
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
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    notFound();
  }
  const role = await getOrganizationMemberRole(id, sessionUser.id);
  if (!role || role === 'viewer') {
    notFound();
  }
  const { members } = await getOrganizationMemberContext(
    id,
    sessionUser.id,
    query
  );
  const canManage = role === 'admin';

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={canManage ? t('description.admin') : t('description.viewer')}
      count={members.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          search={
            <ResourceSearch
              paramKey="name"
              placeholder={t('namePlaceholder')}
            />
          }
          filters={
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
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
            </div>
          }
        />
        <MemberActions organizationId={id} canManage={canManage} />
      </div>
      <ResourceGrid
        items={members}
        renderItem={(member) => (
          <MemberCard
            key={member.id}
            member={member}
            organizationId={id}
            currentUserId={sessionUser.id}
            canManage={canManage}
          />
        )}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(member) => member.id}
      />
    </OrganizationSectionShell>
  );
}
