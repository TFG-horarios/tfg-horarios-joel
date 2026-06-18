'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ClassroomSchema,
  SaveClassroomBodySchema,
  type SaveClassroomDTO,
  type ClassroomDTO,
  type ClassroomIdentifierDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import {
  fetchPaginatedClassrooms,
  fetchAllClassrooms,
  fetchClassroomIdentifiers,
} from './queries';
import type { ClassroomListQueryDTO } from '@tfg-horarios/shared';
import { type ActionResponse } from '@/types/actions';

export async function fetchPaginatedClassroomsAction(
  organizationId: string,
  query: ClassroomListQueryDTO,
  page: number
): Promise<PaginatedResponse<ClassroomDTO>> {
  return fetchPaginatedClassrooms(organizationId, { ...query, page });
}

export async function fetchAllClassroomsAction(
  organizationId: string
): Promise<ClassroomDTO[]> {
  try {
    return await fetchAllClassrooms(organizationId);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (All Classrooms):', error);
    return [];
  }
}

export async function fetchClassroomIdentifiersAction(
  organizationId: string
): Promise<ClassroomIdentifierDTO[]> {
  try {
    return await fetchClassroomIdentifiers(organizationId);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Aulas Identifiers):', error);
    return [];
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

export async function updateClassroomAction(
  organizationId: string,
  classroomId: string,
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
    ]!.classrooms[':id'].$put({
      param: { organizationId, id: classroomId },
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
      message: tSuccess('updated'),
      data: classroom,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteClassroomAction(
  organizationId: string,
  classroomId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.classrooms[':id'].$delete({
      param: { organizationId, id: classroomId },
    });
    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      message: tSuccess('deleted'),
    };
  } catch {
    return {
      success: false,
      message: tErrors('server'),
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

export async function bulkCreateClassrooms(
  organizationId: string,
  dtos: SaveClassroomDTO[]
): Promise<ActionResponse<ClassroomDTO[]>> {
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
      return { success: false, message: t('server') };
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      data: ClassroomSchema.array().parse(payload),
    };
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Aulas Bulk):', error);
    return { success: false, message: t('server') };
  }
}

export async function replaceClassroomsAction(
  organizationId: string,
  dtos: SaveClassroomDTO[]
): Promise<ActionResponse<ClassroomDTO[]>> {
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
      return { success: false, message: t('server') };
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      data: ClassroomSchema.array().parse(payload),
    };
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Aulas Reemplazo Bulk):', error);
    return { success: false, message: t('server') };
  }
}
