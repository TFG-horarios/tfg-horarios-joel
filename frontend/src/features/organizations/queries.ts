import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { OrganizationSchema, type OrganizationDTO } from '@tfg-horarios/shared';

export const fetchOrganizations = cache(
  async (): Promise<OrganizationDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations.$get();

    const status = response.status + 0;
    if (status === 400 || status === 401 || status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return OrganizationSchema.array().parse(payload);
  }
);

export const fetchOrganizationById = cache(
  async (organizationId: string): Promise<OrganizationDTO | null> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[':id'].$get({
      param: { id: organizationId },
    });

    const status = response.status + 0;
    if (status === 404 || status === 401 || status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return OrganizationSchema.parse(payload);
  }
);
