import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/lib/api/server';
import { MemberSchema, type MemberDTO } from '@tfg-horarios/shared';

export type OrganizationMemberContext = {
  members: MemberDTO[];
  currentMember: MemberDTO | null;
};

export async function fetchMembers(
  organizationId: string
): Promise<MemberDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.members.$get({
    param: { organizationId },
  });

  if (response.status === 401 || response.status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return MemberSchema.array().parse(payload);
}

export const getOrganizationMemberContext = cache(
  async (
    organizationId: string,
    userId: string | null
  ): Promise<OrganizationMemberContext> => {
    const members = await fetchMembers(organizationId);
    const currentMember =
      userId === null
        ? null
        : (members.find((member) => member.userId === userId) ?? null);

    return {
      members,
      currentMember,
    };
  }
);

export async function getOrganizationMemberRole(
  organizationId: string,
  userId: string | null
): Promise<MemberDTO['role'] | null> {
  const { currentMember } = await getOrganizationMemberContext(
    organizationId,
    userId
  );

  return currentMember?.role ?? null;
}
