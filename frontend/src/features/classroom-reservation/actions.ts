'use server';

import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import {
  type SaveClassroomReservationDTO,
  type UpdateClassroomReservationStatusDTO,
  ClassroomReservationSchema,
} from '@tfg-horarios/shared';

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
      const errorData = (await response.json()) as any;
      return { success: false as const, error: errorData.error || t('server') };
    }
    return { success: false as const, error: t('server') };
  }

  const payload = await response.json();
  const parsed = ClassroomReservationSchema.parse(payload);

  revalidatePath(
    `/organizations/${organizationId}/academic-years/${data.academicYearId}/classroom-reservations`
  );

  return { success: true as const, data: parsed };
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
      const errorData = (await response.json()) as any;
      return { success: false as const, error: errorData.error || t('server') };
    }
    return { success: false as const, error: t('server') };
  }

  const payload = await response.json();
  const parsed = ClassroomReservationSchema.parse(payload);

  revalidatePath(`/organizations/${organizationId}`, 'layout');

  return { success: true as const, data: parsed };
}
