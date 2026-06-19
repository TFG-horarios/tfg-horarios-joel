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
} from '@tfg-horarios/shared';
import { fetchPaginatedReservations } from './queries';
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
    occupiedSlots: { date: string; slotIndex: number; reason: string }[];
  }>
> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();

  if (datesOfWeek.length === 0) {
    return { success: true, data: { occupiedSlots: [] } };
  }

  const sortedDates = [...datesOfWeek].sort();
  const startDate = sortedDates[0]!;
  const endDate = sortedDates[sortedDates.length - 1]!;

  try {
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
        return {
          success: false,
          message: errorData.message || tErrors('server'),
        };
      }
      return { success: false, message: tErrors('server') };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        occupiedSlots: data.occupiedSlots,
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
