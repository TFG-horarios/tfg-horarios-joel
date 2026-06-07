import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  createPaginatedSchema,
  type PaginatedResponse,
  type ClassroomConfigurationListQueryDTO,
  type ClassroomScheduleQueryDTO,
  type ScheduleSlotDTO,
  ScheduleSlotSchema,
} from '@tfg-horarios/shared';
import { z } from 'zod';

export const fetchActiveClassroomConfigurations = cache(
  async (
    organizationId: string,
    query?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYear: string;
      shift: 'morning' | 'afternoon';
      period: number;
    }>
  > => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms['active-configurations'].$get({
      param: { organizationId },
      query: query || {},
    });

    const status = response.status + 0;

    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(
      z.object({
        classroomId: z.string(),
        academicYear: z.string(),
        shift: z.enum(['morning', 'afternoon']),
        period: z.number(),
      })
    );
    return schema.parse(payload);
  }
);

export const fetchClassroomScheduleSlots = cache(
  async (
    organizationId: string,
    classroomId: string,
    query?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlotDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms[':id']!.slots.$get({
      param: { organizationId, id: classroomId },
      query: query || {},
    });

    const status = response.status + 0;

    if (status === 401 || status === 403 || status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    return ScheduleSlotSchema.array().parse(payload);
  }
);
