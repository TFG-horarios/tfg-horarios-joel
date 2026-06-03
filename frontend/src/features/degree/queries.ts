import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  DegreeSchema,
  type DegreeDTO,
  type DegreeListQueryDTO,
} from '@tfg-horarios/shared';

export async function fetchDegrees(
  organizationId: string,
  query?: DegreeListQueryDTO
): Promise<DegreeDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.degrees.$get({
    param: { organizationId },
    query: query || {},
  });

  const status = Number(response.status);

  if (status === 401 || status === 403) return [];

  if (status !== 200) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return DegreeSchema.array().parse(payload);
}
