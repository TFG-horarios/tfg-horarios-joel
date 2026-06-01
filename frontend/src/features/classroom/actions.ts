'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ClassroomSchema,
  SaveClassroomBodySchema,
  type SaveClassroomDTO,
  type ClassroomDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';

import { type ActionResponse } from '@/types/actions';

export async function bulkCreateClassrooms(
  organizationId: string,
  dtos: SaveClassroomDTO[]
): Promise<ClassroomDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.bulk.$post({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Aulas):', errorText);
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return ClassroomSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Aulas Bulk):', error);
    throw error;
  }
}

export async function replaceClassroomsAction(
  organizationId: string,
  dtos: SaveClassroomDTO[]
): Promise<ClassroomDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.bulk.$put({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        'ERROR DEL BACKEND DE HONO (Aulas Reemplazo Bulk):',
        errorText
      );
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return ClassroomSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Aulas Reemplazo Bulk):', error);
    throw error;
  }
}

export async function createClassroomAction(
  organizationId: string,
  dto: SaveClassroomDTO
): Promise<ActionResponse<ClassroomDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveClassroomBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const classroom = ClassroomSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      message: tSuccess('created'),
      data: classroom,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteAllClassroomsAction(
  organizationId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms.$delete({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      message: tSuccess('deleted'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
