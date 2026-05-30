'use server';

import {
  SubjectGroupSchema,
  type SubjectGroupDTO,
  type SaveSubjectGroupDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { SaveSubjectGroupBodySchema } from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

export async function bulkCreateSubjectGroups(
  organizationId: string,
  subjectId: string,
  dtos: SaveSubjectGroupDTO[]
): Promise<SubjectGroupDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects[':subjectId']!.groups.bulk.$post({
      param: { organizationId, subjectId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Grupos):', errorText);
      throw new Error(t('server'));
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return SubjectGroupSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Grupos Bulk):', error);
    throw error;
  }
}

export async function createSubjectGroupAction(
  organizationId: string,
  subjectId: string,
  dto: SaveSubjectGroupDTO
): Promise<ActionResponse<SubjectGroupDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveSubjectGroupBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects[':subjectId']!.groups.$post({
      param: { organizationId, subjectId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const subjectGroup = SubjectGroupSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return { success: true, message: tSuccess('created'), data: subjectGroup };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateSubjectGroupAction(
  organizationId: string,
  groupId: string,
  dto: SaveSubjectGroupDTO
): Promise<ActionResponse<SubjectGroupDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveSubjectGroupBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ][':id']!.$patch({
      param: { organizationId, id: groupId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const subjectGroup = SubjectGroupSchema.parse(payload);

    revalidatePath(
      `/organizations/${organizationId}/subject-groups/${groupId}`
    );
    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return { success: true, data: subjectGroup };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function removeSubjectGroupAction(
  organizationId: string,
  groupId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ][':id']!.$delete({
      param: { organizationId, id: groupId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subject-groups`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
