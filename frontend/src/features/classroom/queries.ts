import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { ClassroomSchema, type ClassroomDTO } from '@tfg-horarios/shared';

export async function fetchClassrooms(
  organizationId: string
): Promise<ClassroomDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.classrooms.$get({
    param: { organizationId },
  });

  const status = response.status + 0;

  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ClassroomSchema.array().parse(payload);
}
