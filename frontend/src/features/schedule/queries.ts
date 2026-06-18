import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ScheduleSchema,
  ScheduleSlotSchema,
  createPaginatedSchema,
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type ScheduleListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedSchedules = cache(
  async (
    organizationId: string,
    query?: ScheduleListQueryDTO
  ): Promise<PaginatedResponse<ScheduleDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules.$get({
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
    const schema = createPaginatedSchema(ScheduleSchema);
    return schema.parse(payload);
  }
);

export const fetchScheduleById = cache(
  async (
    organizationId: string,
    scheduleId: string
  ): Promise<ScheduleDTO | null> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.$get({
      param: { organizationId, id: scheduleId },
    });

    const status = response.status + 0;
    if (status === 404 || status === 401 || status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return ScheduleSchema.parse(payload);
  }
);

export const fetchScheduleSlots = cache(
  async (
    organizationId: string,
    scheduleId: string
  ): Promise<ScheduleSlotDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.slots.$get({
      param: { organizationId, id: scheduleId },
    });

    const status = response.status + 0;
    if (status === 404 || status === 401 || status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return ScheduleSlotSchema.array().parse(payload);
  }
);
