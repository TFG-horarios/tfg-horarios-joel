import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/lib/api/server';
import {
  MemberSchema,
  type MemberDTO,
  type MemberListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

type OrganizationMemberContext = {
  members: MemberDTO[];
  currentMember: MemberDTO | null;
};

export async function fetchMembers(
  organizationId: string,
  query?: MemberListQueryDTO
): Promise<PaginatedResponse<MemberDTO>> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.members.$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status as number;
  if (status === 401 || status === 403) {
    return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
  if (status !== 200) throw new Error(t('fetchFailed'));

  return (await response.json()) as PaginatedResponse<MemberDTO>;
}

async function fetchAllMembers(organizationId: string): Promise<MemberDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.members.all.$get({
    param: { organizationId },
  });

  const status = response.status as number;
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return MemberSchema.array().parse(payload);
}

const getOrganizationMemberContext = cache(
  async (
    organizationId: string,
    userId: string | null
  ): Promise<OrganizationMemberContext> => {
    const members = await fetchAllMembers(organizationId);
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
