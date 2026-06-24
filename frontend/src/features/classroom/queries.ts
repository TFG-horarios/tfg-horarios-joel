import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ClassroomSchema,
  ClassroomIdentifierSchema,
  createPaginatedSchema,
  type ClassroomDTO,
  type ClassroomIdentifierDTO,
  type ClassroomListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedClassrooms = cache(
  async (
    organizationId: string,
    query?: ClassroomListQueryDTO
  ): Promise<PaginatedResponse<ClassroomDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.$get({
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
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(ClassroomSchema);
    return schema.parse(payload);
  }
);

export const fetchAllClassrooms = cache(
  async (
    organizationId: string,
    academicYearId?: string
  ): Promise<ClassroomDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();

    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.all.$get({
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
    return ClassroomSchema.array().parse(payload);
  }
);

export const fetchClassroomById = cache(
  async (
    organizationId: string,
    classroomId: string,
    academicYearId: string
  ): Promise<ClassroomDTO | null> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms[':id']!.$get({
      param: { organizationId, id: classroomId },
      query: { academicYearId },
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 404 || status === 401 || status === 403) return null;

    const payload = await response.json();
    return ClassroomSchema.parse(payload);
  }
);

export const fetchClassroomIdentifiers = cache(
  async (organizationId: string): Promise<ClassroomIdentifierDTO[]> => {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.identifiers.$get({
      param: { organizationId },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch classroom identifiers');
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return ClassroomIdentifierSchema.array().parse(payload);
  }
);
