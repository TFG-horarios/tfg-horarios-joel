import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ClassroomSchema,
  createPaginatedSchema,
  type ClassroomDTO,
  type ClassroomListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export async function fetchClassrooms(
  organizationId: string,
  query?: ClassroomListQueryDTO
): Promise<PaginatedResponse<ClassroomDTO>> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.classrooms.$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status + 0;

  if (status === 401 || status === 403) {
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    } as PaginatedResponse<ClassroomDTO>;
  }

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  const schema = createPaginatedSchema(ClassroomSchema);
  return schema.parse(payload);
}

export async function fetchAllClassrooms(
  organizationId: string
): Promise<ClassroomDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.classrooms.all.$get({
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
  return ClassroomSchema.array().parse(payload);
}
