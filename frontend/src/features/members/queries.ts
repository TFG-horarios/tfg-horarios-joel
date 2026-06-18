import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/lib/api/server';
import {
  MemberSchema,
  createPaginatedSchema,
  type MemberDTO,
  type MemberListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

type OrganizationMemberContext = {
  members: MemberDTO[];
  currentMember: MemberDTO | null;
};

export const fetchPaginatedMembers = cache(
  async (
    organizationId: string,
    query?: MemberListQueryDTO
  ): Promise<PaginatedResponse<MemberDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.members.$get({
      param: { organizationId },
      query: query || {},
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      };
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(MemberSchema);
    return schema.parse(payload);
  }
);

export const fetchAllMembers = cache(
  async (organizationId: string): Promise<MemberDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.members.all.$get({
      param: { organizationId },
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return MemberSchema.array().parse(payload);
  }
);

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
