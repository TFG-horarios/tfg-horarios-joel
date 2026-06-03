import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ItinerarySchema,
  type ItineraryDTO,
  type ItineraryListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export async function fetchItineraries(
  organizationId: string,
  query?: ItineraryListQueryDTO
): Promise<PaginatedResponse<ItineraryDTO>> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.itineraries.$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status + 0;
  if (status === 401 || status === 403) {
    return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
  if (status !== 200) throw new Error(t('fetchFailed'));

  return (await response.json()) as PaginatedResponse<ItineraryDTO>;
}

export async function fetchAllItineraries(
  organizationId: string
): Promise<ItineraryDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.itineraries.all.$get({
    param: { organizationId },
  });

  const status = Number(response.status);
  if (status === 401 || status === 403) return [];
  if (!response.ok) throw new Error(t('server'));

  const payload = await response.json();
  return ItinerarySchema.array().parse(payload);
}
