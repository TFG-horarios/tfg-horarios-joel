import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { DegreeSchema, type DegreeDTO } from '@tfg-horarios/shared';

export async function fetchDegrees(
  organizationId: string
): Promise<DegreeDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.degrees.$get();

  if (response.status === 401 || response.status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return DegreeSchema.array().parse(payload);
}
