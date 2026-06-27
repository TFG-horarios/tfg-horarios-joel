import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ClassroomReservationSchema,
  createPaginatedSchema,
  type ClassroomReservationDTO,
  type ClassroomReservationListQueryDTO,
  type OccupiedSlotDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedReservations = cache(
  async (
    organizationId: string,
    query?: ClassroomReservationListQueryDTO
  ): Promise<PaginatedResponse<ClassroomReservationDTO>> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();

    const response = await client.api.organizations[':organizationId']![
      'classroom-reservations'
    ].$get({
      param: { organizationId },
      query: query || {},
    });

    const status = response.status + 0;

    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      } as PaginatedResponse<ClassroomReservationDTO>;
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(ClassroomReservationSchema);
    return schema.parse(payload);
  }
);

export const fetchOccupiedSlots = cache(
  async (
    organizationId: string,
    classroomId: string,
    academicYearId: string,
    startDate: string,
    endDate: string
  ): Promise<OccupiedSlotDTO[]> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();

    const response = await client.api.organizations[':organizationId']![
      'classroom-reservations'
    ]['availability'].$get({
      param: { organizationId },
      query: { classroomId, academicYearId, startDate, endDate },
    });

    if (!response.ok) {
      const status = response.status + 0;
      if (status === 400 || status === 404) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || t('server'));
      }
      throw new Error(t('server'));
    }

    const data = await response.json();
    return data.occupiedSlots;
  }
);
