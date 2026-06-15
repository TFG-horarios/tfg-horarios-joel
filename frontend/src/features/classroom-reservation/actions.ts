'use server';

import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import {
  type SaveClassroomReservationDTO,
  type UpdateClassroomReservationStatusDTO,
  ClassroomReservationSchema,
  type ClassroomReservationListQueryDTO,
} from '@tfg-horarios/shared';
import { fetchClassroomScheduleSlots } from '../classroom-schedule/queries';
import { fetchReservations } from './queries';
import { fetchSchedules } from '../schedule/queries';

export async function fetchReservationsAction(
  organizationId: string,
  query: ClassroomReservationListQueryDTO
) {
  return await fetchReservations(organizationId, query);
}

export async function requestReservationAction(
  organizationId: string,
  data: SaveClassroomReservationDTO
) {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();

  const response = await client.api.organizations[':organizationId']![
    'classroom-reservations'
  ].$post({
    param: { organizationId },
    json: data,
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      const errorData = (await response.json()) as { error?: string };
      return { success: false, error: errorData.error || t('server') };
    }
    return { success: false, error: t('server') };
  }

  const payload = await response.json();
  const parsed = ClassroomReservationSchema.parse(payload);

  revalidatePath(
    `/organizations/${organizationId}/academic-years/${data.academicYearId}/classroom-reservations`
  );

  return { success: true, data: parsed };
}

export async function updateReservationStatusAction(
  organizationId: string,
  id: string,
  data: UpdateClassroomReservationStatusDTO
) {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();

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
      const errorData = (await response.json()) as { error?: string };
      return { success: false, error: errorData.error || t('server') };
    }
    return { success: false, error: t('server') };
  }

  const payload = await response.json();
  const parsed = ClassroomReservationSchema.parse(payload);

  revalidatePath(`/organizations/${organizationId}`, 'layout');

  return { success: true, data: parsed };
}

export async function getOccupiedSlotsAction(
  organizationId: string,
  classroomId: string,
  academicYearId: string,
  datesOfWeek: string[]
) {
  try {
    const scheduleSlots = await fetchClassroomScheduleSlots(
      organizationId,
      classroomId,
      { academicYearId }
    );

    const schedulesResp = await fetchSchedules(organizationId, {
      academicYearId,
      limit: 1000,
    });

    const schedulePeriodMap = new Map(
      schedulesResp.data.map((s) => [s.id, s.period])
    );
    const slotsWithPeriod = scheduleSlots.map((slot) => ({
      ...slot,
      period: schedulePeriodMap.get(slot.scheduleId),
    }));

    const reservationsPromises = datesOfWeek.map((date) =>
      fetchReservations(organizationId, {
        classroomId,
        academicYearId,
        date,
      }).then((res) => res.data)
    );

    const reservationsArrays = await Promise.all(reservationsPromises);
    const reservations = reservationsArrays.flat();

    return {
      success: true,
      data: {
        scheduleSlots: slotsWithPeriod,
        reservations: reservations.filter((r) => r.status !== 'REJECTED'),
      },
    };
  } catch {
    return { success: false, error: 'Failed to fetch occupied slots' };
  }
}
