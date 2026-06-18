'use server';

import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import {
  type SaveClassroomReservationDTO,
  type UpdateClassroomReservationStatusDTO,
  ClassroomReservationSchema,
  type ClassroomReservationListQueryDTO,
  type ClassroomReservationDTO,
  type ScheduleDTO,
  type PaginatedResponse,
  type ScheduleSlotDTO,
} from '@tfg-horarios/shared';
import { fetchClassroomScheduleSlots } from '../classroom-schedule/queries';
import { fetchPaginatedReservations } from './queries';
import { fetchPaginatedSchedules } from '../schedule/queries';
import { type ActionResponse } from '@/types/actions';

export async function fetchPaginatedReservationsAction(
  organizationId: string,
  query: ClassroomReservationListQueryDTO
) {
  return await fetchPaginatedReservations(organizationId, query);
}

export async function getOccupiedSlotsAction(
  organizationId: string,
  classroomId: string,
  academicYearId: string,
  datesOfWeek: string[]
): Promise<
  ActionResponse<{
    scheduleSlots: (ScheduleSlotDTO & { period?: number })[];
    reservations: ClassroomReservationDTO[];
  }>
> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const scheduleSlots = await fetchClassroomScheduleSlots(
      organizationId,
      classroomId,
      { academicYearId }
    );

    const schedulesResp = await fetchPaginatedSchedules(organizationId, {
      academicYearId,
      limit: 1000,
    });

    const schedulePeriodMap = new Map(
      schedulesResp.data.map((s: ScheduleDTO) => [s.id, s.period])
    );
    const slotsWithPeriod = scheduleSlots.map((slot) => ({
      ...slot,
      period: schedulePeriodMap.get(slot.scheduleId),
    }));

    const reservationsPromises = datesOfWeek.map((date) =>
      fetchPaginatedReservations(organizationId, {
        classroomId,
        academicYearId,
        date,
      }).then((res: PaginatedResponse<ClassroomReservationDTO>) => res.data)
    );

    const reservationsArrays = await Promise.all(reservationsPromises);
    const reservations = reservationsArrays.flat();

    return {
      success: true,
      data: {
        scheduleSlots: slotsWithPeriod,
        reservations: reservations.filter(
          (r: ClassroomReservationDTO) => r.status !== 'REJECTED'
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function requestReservationAction(
  organizationId: string,
  data: SaveClassroomReservationDTO
): Promise<ActionResponse<ClassroomReservationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const client = await getServerClient();

  try {
    const response = await client.api.organizations[':organizationId']![
      'classroom-reservations'
    ].$post({
      param: { organizationId },
      json: data,
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        return {
          success: false,
          message: errorData.message || errorData.error || tErrors('server'),
        };
      }
      return { success: false, message: tErrors('server') };
    }

    const payload = await response.json();
    const parsed = ClassroomReservationSchema.parse(payload);

    revalidatePath(
      `/organizations/${organizationId}/academic-years/${data.academicYearId}/classroom-reservations`
    );

    return { success: true, message: tSuccess('created'), data: parsed };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateReservationStatusAction(
  organizationId: string,
  id: string,
  data: UpdateClassroomReservationStatusDTO
): Promise<ActionResponse<ClassroomReservationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const client = await getServerClient();

  try {
    const response = await client.api.organizations[':organizationId']![
      'classroom-reservations'
    ][':id']!.status.$patch({
      param: { organizationId, id },
      json: data,
    });

    if (!response.ok) {
      if (
        response.status === 400 ||
        response.status === 403 ||
        response.status === 404
      ) {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        return {
          success: false,
          message: errorData.message || errorData.error || tErrors('server'),
        };
      }
      return { success: false, message: tErrors('server') };
    }

    const payload = await response.json();
    const parsed = ClassroomReservationSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, message: tSuccess('updated'), data: parsed };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
