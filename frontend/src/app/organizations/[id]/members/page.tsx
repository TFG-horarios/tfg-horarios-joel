import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberContext } from '@/features/members/queries';
import { MemberCard } from '@/features/members/components/member-card';
import { MemberActions } from '@/features/members/components/member-actions';

type OrganizationMembersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationMembersPage({
  params,
}: OrganizationMembersPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.members');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    notFound();
  }
  const { members, currentMember } = await getOrganizationMemberContext(
    id,
    sessionUser.id
  );
  if (!currentMember || currentMember.role === 'viewer') {
    notFound();
  }
  const canManage = currentMember.role === 'admin';

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={canManage ? t('description.admin') : t('description.viewer')}
      count={members.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
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
