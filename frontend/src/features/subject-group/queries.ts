import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  SubjectGroupSchema,
  type SubjectGroupDTO,
  type SubjectGroupListQueryDTO,
} from '@tfg-horarios/shared';

export async function fetchSubjectGroups(
  organizationId: string,
  query?: SubjectGroupListQueryDTO
): Promise<SubjectGroupDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId']![
    'subject-groups'
  ].$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status as number;
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectGroupSchema.array().parse(payload);
}
