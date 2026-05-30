import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { SubjectSchema, type SubjectDTO } from '@tfg-horarios/shared';

export async function fetchSubjects(
  organizationId: string
): Promise<SubjectDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.subjects.$get({
    param: { organizationId },
  });

  const status = response.status as number;
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectSchema.array().parse(payload);
}
