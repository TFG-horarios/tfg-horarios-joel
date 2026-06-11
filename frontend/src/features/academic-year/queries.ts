import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { AcademicYearSchema, type AcademicYearDTO } from '@tfg-horarios/shared';

export const fetchAcademicYears = cache(
  async (organizationId: string): Promise<AcademicYearDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ].$get({
      param: { organizationId },
    });

    const status = response.status + 0;

    if (status === 401 || status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return AcademicYearSchema.array().parse(payload);
  }
);

export const fetchActiveAcademicYear = cache(
  async (organizationId: string): Promise<AcademicYearDTO | null> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ].active.$get({
      param: { organizationId },
    });

    const status = response.status + 0;

    if (status === 404 || status === 401 || status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return AcademicYearSchema.parse(payload);
  }
);
