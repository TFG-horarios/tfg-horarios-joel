import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  SubjectGroupSchema,
  SubjectGroupIdentifierSchema,
  createPaginatedSchema,
  type SubjectGroupDTO,
  type SubjectGroupIdentifierDTO,
  type SubjectGroupListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedSubjectGroups = cache(
  async (
    organizationId: string,
    query?: SubjectGroupListQueryDTO
  ): Promise<PaginatedResponse<SubjectGroupDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].$get({
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
    const schema = createPaginatedSchema(SubjectGroupSchema);
    return schema.parse(payload);
  }
);

export const fetchAllSubjectGroups = cache(
  async (
    organizationId: string,
    academicYearId?: string
  ): Promise<SubjectGroupDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].all.$get({
      param: { organizationId },
      query: { academicYearId },
    });

    const status = response.status + 0;
    if (status === 401 || status === 403) return [];

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return SubjectGroupSchema.array().parse(payload);
  }
);

export const fetchSubjectGroupIdentifiers = cache(
  async (organizationId: string): Promise<SubjectGroupIdentifierDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].identifiers.$get({
      param: { organizationId },
    });

    const status = response.status + 0;
    if (status === 401 || status === 403) return [];

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return SubjectGroupIdentifierSchema.array().parse(payload);
  }
);
