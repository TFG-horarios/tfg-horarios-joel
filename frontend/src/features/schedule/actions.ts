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
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';

import {
  GenerationScopeSchema,
  SaveScheduleSlotBodySchema,
} from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

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

    revalidatePath(`/organizations/${organizationId}/schedules`);

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

    revalidatePath(`/organizations/${organizationId}/schedules`);
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
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const slot = ScheduleSlotSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/schedules`);

    return { success: true, data: slot };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
