import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  SubjectSchema,
  SubjectIdentifierSchema,
  createPaginatedSchema,
  type SubjectDTO,
  type SubjectIdentifierDTO,
  type SubjectListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedSubjects = cache(
  async (
    organizationId: string,
    query?: SubjectListQueryDTO
  ): Promise<PaginatedResponse<SubjectDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.$get({
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
    const schema = createPaginatedSchema(SubjectSchema);
    return schema.parse(payload);
  }
);

export const fetchAllSubjects = cache(
  async (
    organizationId: string,
    academicYearId?: string
  ): Promise<SubjectDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.all.$get({
      param: { organizationId },
      query: { academicYearId },
    });

    const status = response.status + 0;
    if (status === 401 || status === 403) return [];

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return SubjectSchema.array().parse(payload);
  }
);

export const fetchSubjectIdentifiers = cache(
  async (organizationId: string): Promise<SubjectIdentifierDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.identifiers.$get({
      param: { organizationId },
    });

    const status = response.status + 0;
    if (status === 401 || status === 403) return [];

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return SubjectIdentifierSchema.array().parse(payload);
  }
);
