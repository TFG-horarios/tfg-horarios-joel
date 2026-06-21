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
    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      };
    }

    if (!response.ok) {
      throw new Error(t('server'));
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
    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return MemberSchema.array().parse(payload);
  }
);

export const fetchMeMember = cache(
  async (organizationId: string): Promise<MemberDTO | null> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.members.me.$get({
      param: { organizationId },
    });
    const status = response.status + 0;
    if (status === 401 || status === 403 || status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return MemberSchema.parse(payload);
  }
);

export async function getOrganizationMemberRole(
  organizationId: string,
  userId: string | null
): Promise<MemberDTO['role'] | null> {
  if (!userId) return null;
  const currentMember = await fetchMeMember(organizationId);
  return currentMember?.role ?? null;
}
