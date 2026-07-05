'use server';

import { getServerClient } from '@/lib/api/server';
import {
  createApiResponseError,
  getActionErrorMessage,
} from '@/lib/api/errors';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import {
  type SaveClassroomReservationDTO,
  type UpdateClassroomReservationStatusDTO,
  ClassroomReservationSchema,
  type ClassroomReservationListQueryDTO,
  type ClassroomReservationDTO,
  type OccupiedSlotDTO,
} from '@tfg-horarios/shared';
import { fetchPaginatedReservations, fetchOccupiedSlots } from './queries';
import { type ActionResponse } from '@/types/actions';

export async function fetchPaginatedReservationsAction(
  organizationId: string,
  query: ClassroomReservationListQueryDTO
) {
  return await fetchPaginatedReservations(organizationId, query);
}

export async function fetchOccupiedSlotsAction(
  organizationId: string,
  classroomId: string,
  academicYearId: string,
  datesOfWeek: string[]
): Promise<
  ActionResponse<{
    occupiedSlots: OccupiedSlotDTO[];
  }>
> {
  const tErrors = await getTranslations('Common.errors');

  if (datesOfWeek.length === 0) {
    return { success: true, data: { occupiedSlots: [] } };
  }

  const sortedDates = [...datesOfWeek].sort();
  const startDate = sortedDates[0]!;
  const endDate = sortedDates[sortedDates.length - 1]!;

  try {
    const occupiedSlots = await fetchOccupiedSlots(
      organizationId,
      classroomId,
      academicYearId,
      startDate,
      endDate
    );

    return {
      success: true,
      data: { occupiedSlots },
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
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
      throw await createApiResponseError(response, tErrors('server'));
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
      message: getActionErrorMessage(error, tErrors('generic')),
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
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const parsed = ClassroomReservationSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, message: tSuccess('updated'), data: parsed };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function cancelReservationAction(
  organizationId: string,
  id: string
): Promise<ActionResponse<ClassroomReservationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const client = await getServerClient();

  try {
    const response = await client.api.organizations[':organizationId']![
      'classroom-reservations'
    ][':id']!.$delete({
      param: { organizationId, id },
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const parsed = ClassroomReservationSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return {
      success: true,
      message: tSuccess('deleted') || 'Reserva cancelada',
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}
