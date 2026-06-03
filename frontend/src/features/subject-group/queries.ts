import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  SubjectGroupSchema,
  type SubjectGroupDTO,
  type SubjectGroupListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export async function fetchSubjectGroups(
  organizationId: string,
  query?: SubjectGroupListQueryDTO
): Promise<PaginatedResponse<SubjectGroupDTO>> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId']![
    'subject-groups'
  ].$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status as number;
  if (status === 401 || status === 403) {
    return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
  if (status !== 200) throw new Error(t('fetchFailed'));

  return (await response.json()) as PaginatedResponse<SubjectGroupDTO>;
}

export async function fetchAllSubjectGroups(
  organizationId: string
): Promise<SubjectGroupDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId']![
    'subject-groups'
  ].all.$get({
    param: { organizationId },
  });

  const status = Number(response.status);
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectGroupSchema.array().parse(payload);
}
