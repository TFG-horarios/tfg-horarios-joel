import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  DegreeSchema,
  type DegreeDTO,
  type DegreeListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchDegrees = cache(
  async (
    organizationId: string,
    query?: DegreeListQueryDTO
  ): Promise<PaginatedResponse<DegreeDTO>> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.$get({
      param: { organizationId },
      query: query || {},
    });

    const status = Number(response.status);
    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      };
    }
    if (status !== 200) throw new Error(t('fetchFailed'));

    return (await response.json()) as PaginatedResponse<DegreeDTO>;
  }
);

export const fetchAllDegrees = cache(
  async (organizationId: string): Promise<DegreeDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.all.$get({
      param: { organizationId },
    });

    const status = Number(response.status);
    if (status === 401 || status === 403) return [];
    if (status !== 200) throw new Error(t('server'));

    const payload = await response.json();
    return DegreeSchema.array().parse(payload);
  }
);
