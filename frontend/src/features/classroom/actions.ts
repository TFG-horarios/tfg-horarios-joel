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
import { getFieldErrors } from '@/lib/zod';

export type ClassroomActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  classroom: ClassroomDTO | null;
};

const initialState: ClassroomActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  classroom: null,
};

export async function createClassroom(
  organizationId: string,
  dto: SaveClassroomDTO
): Promise<ClassroomDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    organizationId
  ]!.classrooms.$post({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ClassroomSchema.parse(payload);
}

export async function bulkCreateClassrooms(
  organizationId: string,
  dtos: SaveClassroomDTO[]
): Promise<ClassroomDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      organizationId
    ]!.classrooms.bulk.$post({
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR DEL BACKEND DE HONO (Aulas):', errorText);
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return ClassroomSchema.array().parse(payload);
  } catch (error) {
    console.error('❌ ERROR EN EL SERVER ACTION (Aulas Bulk):', error);
    throw error;
  }
}

export async function createClassroomAction(
  organizationId: string,
  _prevState: ClassroomActionState,
  formData: FormData
): Promise<ClassroomActionState> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const raw = Object.fromEntries(formData);

  const parsedInput = SaveClassroomBodySchema.safeParse({
    name: raw.name,
    capacity: Number(raw.capacity),
    type: raw.type,
  });

  if (!parsedInput.success) {
    return {
      ...initialState,
      message: tErrors('validation'),
      fieldErrors: getFieldErrors(parsedInput.error),
    };
  }

  try {
    const classroom = await createClassroom(organizationId, parsedInput.data);
    revalidatePath(`/organizations/${organizationId}/classrooms`);

    return {
      success: true,
      message: tSuccess('created'),
      fieldErrors: {},
      classroom,
    };
  } catch (error) {
    return {
      ...initialState,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
