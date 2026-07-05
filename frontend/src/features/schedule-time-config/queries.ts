import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/lib/api/server';
import { createApiResponseError } from '@/lib/api/errors';
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
    const tErrors = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'].$get({
      param: { organizationId, academicYearId },
      query,
    });
    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }
    return ScheduleTimeConfigSchema.array().parse(await response.json());
  }
);

export const fetchTimeConfigPossibilities = cache(
  async (
    organizationId: string,
    academicYearId: string
  ): Promise<ScheduleTimeConfigPossibilityDTO[]> => {
    const tErrors = await getTranslations('Common.errors');
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'].possibilities.$get({
      param: { organizationId, academicYearId },
    });
    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }
    return ScheduleTimeConfigPossibilitySchema.array().parse(
      await response.json()
    );
  }
);
