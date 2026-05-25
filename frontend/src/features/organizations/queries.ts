import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import type { OrganizationDTO } from '@tfg-horarios/shared';

export async function fetchOrganizations(): Promise<OrganizationDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations.$get();

  if (response.status === 400) return [];
  if (!response.ok) throw new Error(t('server'));

  return await response.json();
}

export async function fetchOrganizationById(
  organizationId: string
): Promise<OrganizationDTO | null> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':id'].$get({
    param: { id: organizationId },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(t('server'));

  return await response.json();
}
