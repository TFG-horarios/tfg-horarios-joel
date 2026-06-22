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
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import {
  fetchPaginatedSchedules,
  fetchScheduleById,
  fetchScheduleSlots,
} from './queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { generateScheduleCsv } from './utils';

import {
  GenerationScopeSchema,
  SaveScheduleSlotBodySchema,
} from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

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
    const [
      schedule,
      slots,
      classrooms,
      subjects,
      subjectGroups,
      degrees,
      academicYears,
    ] = await Promise.all([
      fetchScheduleById(organizationId, scheduleId),
      fetchScheduleSlots(organizationId, scheduleId),
      fetchAllClassrooms(organizationId),
      fetchAllSubjects(organizationId),
      fetchAllSubjectGroups(organizationId),
      fetchAllDegrees(organizationId),
      fetchAcademicYears(organizationId),
    ]);
    if (!schedule || !slots) {
      return { success: false, message: tErrors('server') };
    }

    const result = await generateScheduleCsv(
      schedule,
      slots,
      classrooms,
      subjects,
      subjectGroups,
      degrees,
      academicYears
    );

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
      let message = tErrors('server');
      try {
        const errorData = (await response.json()) as Record<string, unknown>;
        if (typeof errorData.message === 'string') {
          message = errorData.message;
        }
      } catch {
        message = tErrors('server');
      }
      throw new Error(message);
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
