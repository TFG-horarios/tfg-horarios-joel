import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ScheduleSchema,
  ScheduleSlotSchema,
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type ScheduleListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export async function fetchSchedules(
  organizationId: string,
  query?: ScheduleListQueryDTO
): Promise<PaginatedResponse<ScheduleDTO>> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.schedules.$get({
    param: { organizationId },
    query: query || {},
  });

  const status = response.status as number;
  if (status === 401 || status === 403) {
    return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
  if (status !== 200) throw new Error(t('fetchFailed'));

  return (await response.json()) as PaginatedResponse<ScheduleDTO>;
}

export async function fetchAllSchedules(
  organizationId: string
): Promise<ScheduleDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    ':organizationId'
  ]!.schedules.all.$get({
    param: { organizationId },
  });

  const status = Number(response.status);
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ScheduleSchema.array().parse(payload);
}

export async function fetchSchedule(
  organizationId: string,
  scheduleId: string
): Promise<ScheduleDTO | null> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId']!.schedules[
    ':id'
  ]!.$get({
    param: { organizationId, id: scheduleId },
  });

  const status = response.status as number;
  if (status === 404) return null;
  if (status === 401 || status === 403) return null;

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ScheduleSchema.parse(payload);
}

export async function fetchScheduleSlots(
  organizationId: string,
  scheduleId: string
): Promise<ScheduleSlotDTO[]> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId']!.schedules[
    ':id'
  ]!.slots.$get({
    param: { organizationId, id: scheduleId },
  });

  const status = response.status as number;
  if (status === 404) return [];
  if (status === 401 || status === 403) return [];

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ScheduleSlotSchema.array().parse(payload);
}
