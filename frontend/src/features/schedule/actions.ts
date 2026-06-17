'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ScheduleSchema,
  ScheduleSlotSchema,
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type GenerationScopeDTO,
  type SaveScheduleSlotDTO,
  type ScheduleListQueryDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { fetchSchedules } from './queries';

import {
  GenerationScopeSchema,
  SaveScheduleSlotBodySchema,
} from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

export async function fetchSchedulesAction(
  organizationId: string,
  query: ScheduleListQueryDTO,
  page: number
) {
  return fetchSchedules(organizationId, { ...query, page });
}

export async function generateSchedulesAction(
  organizationId: string,
  scope: GenerationScopeDTO
): Promise<ActionResponse<ScheduleDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = GenerationScopeSchema.safeParse(scope);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
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
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
    return { success: false, message: tErrors('validation') };
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
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
    return { success: false, message: tErrors('validation') };
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
      try {
        const errData = (await response.json()) as Record<string, unknown>;
        const message =
          typeof errData.message === 'string'
            ? errData.message
            : tErrors('server');
        throw new Error(message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : tErrors('server'), {
          cause: e,
        });
      }
    }

    const payload = await response.json();
    const slot = ScheduleSlotSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: slot };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules`);

    return { success: true, message: tSuccess('deleted') };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
