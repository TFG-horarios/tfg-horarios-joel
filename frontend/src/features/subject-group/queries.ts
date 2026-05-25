import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { SubjectGroupSchema, type SubjectGroupDTO } from '@tfg-horarios/shared';

export async function fetchSubjectGroups(
  organizationId: string
): Promise<SubjectGroupDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!['subject-groups'].$get();

  if (response.status === 401 || response.status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectGroupSchema.array().parse(payload);
}
