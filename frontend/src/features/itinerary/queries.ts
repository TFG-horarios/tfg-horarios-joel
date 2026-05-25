import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { ItinerarySchema, type ItineraryDTO } from '@tfg-horarios/shared';

export async function fetchItineraries(
  organizationId: string
): Promise<ItineraryDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.itineraries.$get();

  if (response.status === 401 || response.status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ItinerarySchema.array().parse(payload);
}
