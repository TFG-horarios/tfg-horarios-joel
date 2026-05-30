'use server';

import {
  SubjectSchema,
  type SubjectDTO,
  type SaveSubjectDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/dist/server/web/spec-extension/revalidate';
import { getTranslations } from 'next-intl/server';

import { SaveSubjectBodySchema } from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

export async function bulkCreateSubjects(
  organizationId: string,
  degreeId: string,
  dtos: SaveSubjectDTO[]
): Promise<SubjectDTO[]> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.degrees[
      ':degreeId'
    ]!.subjects.bulk.$post({
      param: { organizationId, degreeId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Asignaturas):', errorText);
      throw new Error(tErrors('server'));
    }

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/subjects`);

    return SubjectSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Asignaturas Bulk):', error);
    throw error;
  }
}

export async function createSubjectAction(
  organizationId: string,
  degreeId: string,
  dto: SaveSubjectDTO
): Promise<ActionResponse<SubjectDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveSubjectBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.degrees[
      ':degreeId'
    ]!.subjects.$post({
      param: { organizationId, degreeId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const subject = SubjectSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/subjects`);

    return { success: true, message: tSuccess('created'), data: subject };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateSubjectAction(
  organizationId: string,
  subjectId: string,
  dto: SaveSubjectDTO
): Promise<ActionResponse<SubjectDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveSubjectBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects[':id']!.$patch({
      param: { organizationId, id: subjectId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const subject = SubjectSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/subjects/${subjectId}`);
    revalidatePath(`/organizations/${organizationId}/subjects`);

    return { success: true, data: subject };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function removeSubjectAction(
  organizationId: string,
  subjectId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects[':id']!.$delete({
      param: { organizationId, id: subjectId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subjects`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

// TODO: Implement in backend
/*export async function deleteAllSubjects(organizationId: string): Promise<void> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':organizationId'].subjects.$delete({
    param: { organizationId },
  });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }

  revalidatePath(`/organizations/${organizationId}/subjects`);
}*/
