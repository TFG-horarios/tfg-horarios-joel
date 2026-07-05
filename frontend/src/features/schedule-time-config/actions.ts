'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/api/server';
import {
  createApiResponseError,
  getActionErrorMessage,
} from '@/lib/api/errors';
import {
  SaveScheduleTimeConfigBodySchema,
  ScheduleTimeConfigSchema,
  UpdateScheduleTimeConfigBodySchema,
  type SaveScheduleTimeConfigBodyDTO,
  type ScheduleTimeConfigDTO,
  type UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';
import type { ActionResponse } from '@/types/actions';

const path = (organizationId: string, academicYearId: string) =>
  `/organizations/${organizationId}/academic-years/${academicYearId}/time-configs`;

export async function createScheduleTimeConfigAction(
  organizationId: string,
  academicYearId: string,
  input: SaveScheduleTimeConfigBodyDTO
): Promise<ActionResponse<ScheduleTimeConfigDTO>> {
  const parsed = SaveScheduleTimeConfigBodySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Configuración no válida',
      errors: zodErrorToActionErrors(parsed.error),
    };
  }
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'].$post({
      param: { organizationId, academicYearId },
      json: parsed.data,
    });
    if (!response.ok) {
      throw await createApiResponseError(
        response,
        'Error al crear la configuración'
      );
    }
    revalidatePath(path(organizationId, academicYearId));
    return {
      success: true,
      data: ScheduleTimeConfigSchema.parse(await response.json()),
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, 'Error al crear la configuración'),
    };
  }
}

export async function updateScheduleTimeConfigAction(
  organizationId: string,
  academicYearId: string,
  id: string,
  input: UpdateScheduleTimeConfigBodyDTO
): Promise<ActionResponse<ScheduleTimeConfigDTO>> {
  const parsed = UpdateScheduleTimeConfigBodySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Configuración no válida',
      errors: zodErrorToActionErrors(parsed.error),
    };
  }
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'][':id'].$patch({
      param: { organizationId, academicYearId, id },
      json: parsed.data,
    });
    if (!response.ok) {
      throw await createApiResponseError(
        response,
        'Error al actualizar la configuración'
      );
    }
    revalidatePath(path(organizationId, academicYearId));
    return {
      success: true,
      data: ScheduleTimeConfigSchema.parse(await response.json()),
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(
        error,
        'Error al actualizar la configuración'
      ),
    };
  }
}

export async function deleteScheduleTimeConfigAction(
  organizationId: string,
  academicYearId: string,
  id: string
): Promise<ActionResponse<void>> {
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':academicYearId']['time-configs'][':id'].$delete({
      param: { organizationId, academicYearId, id },
    });
    if (!response.ok) {
      throw await createApiResponseError(
        response,
        'Error al eliminar la configuración'
      );
    }
    revalidatePath(path(organizationId, academicYearId));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(
        error,
        'Error al eliminar la configuración'
      ),
    };
  }
}
