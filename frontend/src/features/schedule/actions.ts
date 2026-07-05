'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ScheduleSchema,
  ScheduleSlotSchema,
  ImportSchedulesBodySchema,
  ImportSchedulesOverwriteSchema,
  ImportSchedulesResultSchema,
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type GenerationScopeDTO,
  type ImportSchedulesBodyDTO,
  type ImportSchedulesOverwriteDTO,
  type ImportSchedulesResultDTO,
  type SaveScheduleSlotDTO,
  type ScheduleListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import {
  createApiResponseError,
  getActionErrorMessage,
} from '@/lib/api/errors';
import { fetchPaginatedSchedules } from './queries';
import { buildScheduleCsvExport } from './services/export-schedule-csv';

import {
  GenerationScopeSchema,
  SaveScheduleSlotBodySchema,
} from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';

export async function fetchPaginatedSchedulesAction(
  organizationId: string,
  query: ScheduleListQueryDTO,
  page: number
): Promise<PaginatedResponse<ScheduleDTO>> {
  return fetchPaginatedSchedules(organizationId, { ...query, page });
}

export async function exportScheduleCsvAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<{ csv: string; filename: string }>> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const result = await buildScheduleCsvExport(organizationId, scheduleId);
    if (!result) {
      return { success: false, message: tErrors('server') };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function generateSchedulesAction(
  organizationId: string,
  scope: GenerationScopeDTO
): Promise<ActionResponse<ScheduleDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = GenerationScopeSchema.safeParse(scope);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules.generate.$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function checkScheduleOverwriteAction(
  organizationId: string,
  scope: GenerationScopeDTO
): Promise<ActionResponse<ScheduleDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = GenerationScopeSchema.safeParse(scope);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules['check-overwrite'].$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function checkImportSchedulesOverwriteAction(
  organizationId: string,
  input: ImportSchedulesBodyDTO
): Promise<ActionResponse<ImportSchedulesOverwriteDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = ImportSchedulesBodySchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules.import['check-overwrite'].$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const result = ImportSchedulesOverwriteSchema.parse(payload);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function importSchedulesAction(
  organizationId: string,
  input: ImportSchedulesBodyDTO
): Promise<ActionResponse<ImportSchedulesResultDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = ImportSchedulesBodySchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules.import.$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const result = ImportSchedulesResultSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function publishScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<ScheduleDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.publish.$patch({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function unpublishScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<ScheduleDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.unpublish.$patch({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function updateScheduleSlotAction(
  organizationId: string,
  slotId: string,
  dto: SaveScheduleSlotDTO
): Promise<ActionResponse<ScheduleSlotDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveScheduleSlotBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.slots[
      ':id'
    ]!.$patch({
      param: { organizationId, id: slotId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const slot = ScheduleSlotSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: slot };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function deleteScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.$delete({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules`);

    return { success: true, message: tSuccess('deleted') };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}
