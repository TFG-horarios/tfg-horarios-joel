import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import {
  ScheduleTimeConfigSchema,
  ScheduleTimeConfigPossibilitySchema,
  type ScheduleTimeConfigDTO,
  type ScheduleTimeConfigPossibilityDTO,
  type ScheduleTimeConfigListQueryDTO,
} from '@tfg-horarios/shared';

export const fetchScheduleTimeConfigs = cache(
  async (
    organizationId: string,
    academicYearId: string,
    query: ScheduleTimeConfigListQueryDTO = {}
  ): Promise<ScheduleTimeConfigDTO[]> => {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'].$get({
      param: { organizationId, academicYearId },
      query,
    });
    if (!response.ok) return [];
    return ScheduleTimeConfigSchema.array().parse(await response.json());
  }
);

export const fetchTimeConfigPossibilities = cache(
  async (
    organizationId: string,
    academicYearId: string
  ): Promise<ScheduleTimeConfigPossibilityDTO[]> => {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'].possibilities.$get({
      param: { organizationId, academicYearId },
    });
    if (!response.ok) return [];
    return ScheduleTimeConfigPossibilitySchema.array().parse(
      await response.json()
    );
  }
);
