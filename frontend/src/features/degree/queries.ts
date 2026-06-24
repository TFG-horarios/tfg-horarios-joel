import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  DegreeSchema,
  DegreeIdentifierSchema,
  createPaginatedSchema,
  type DegreeDTO,
  type DegreeListQueryDTO,
  type PaginatedResponse,
  type DegreeIdentifierDTO,
} from '@tfg-horarios/shared';

export const fetchPaginatedDegrees = cache(
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
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      };
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(DegreeSchema);
    return schema.parse(payload);
  }
);

export const fetchAllDegrees = cache(
  async (
    organizationId: string,
    academicYearId?: string
  ): Promise<DegreeDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.all.$get({
      param: { organizationId },
      query: { academicYearId },
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return DegreeSchema.array().parse(payload);
  }
);

export const fetchDegreeIdentifiers = cache(
  async (organizationId: string): Promise<DegreeIdentifierDTO[]> => {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.identifiers.$get({
      param: { organizationId },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch degree identifiers');
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return DegreeIdentifierSchema.array().parse(payload);
  }
);
