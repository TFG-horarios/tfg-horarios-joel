'use server';

import {
  SubjectSchema,
  type SubjectDTO,
  type SaveSubjectDTO,
  type BulkSaveSubjectDTO,
  type SubjectIdentifierDTO,
  type SubjectListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  fetchPaginatedSubjects,
  fetchAllSubjects,
  fetchSubjectIdentifiers,
} from './queries';
import { SaveSubjectBodySchema } from '@tfg-horarios/shared';
import { type ActionResponse } from '@/types/actions';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';

export async function fetchPaginatedSubjectsAction(
  organizationId: string,
  query: SubjectListQueryDTO,
  page: number
): Promise<PaginatedResponse<SubjectDTO>> {
  return fetchPaginatedSubjects(organizationId, { ...query, page });
}

export async function fetchAllSubjectsAction(
  organizationId: string
): Promise<SubjectDTO[]> {
  return fetchAllSubjects(organizationId);
}

export async function fetchSubjectIdentifiersAction(
  organizationId: string
): Promise<SubjectIdentifierDTO[]> {
  return fetchSubjectIdentifiers(organizationId);
}

export async function bulkCreateSubjects(
  organizationId: string,
  dtos: BulkSaveSubjectDTO[]
): Promise<ActionResponse<SubjectDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.bulk.$post({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/subjects`);

    return {
      success: true,
      message: tSuccess('created'),
      data: SubjectSchema.array().parse(payload),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function replaceSubjectsAction(
  organizationId: string,
  dtos: BulkSaveSubjectDTO[]
): Promise<ActionResponse<SubjectDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.bulk.$put({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/subjects`);

    return {
      success: true,
      message: tSuccess('updated'),
      data: SubjectSchema.array().parse(payload),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
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
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
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
  const tSuccess = await getTranslations('Common.success');

  const parsedInput = SaveSubjectBodySchema.safeParse(dto);
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

    return { success: true, message: tSuccess('updated'), data: subject };
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
  const tSuccess = await getTranslations('Common.success');

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
    return { success: true, message: tSuccess('deleted') };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteSubjectAction(
  organizationId: string,
  subjectId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects[':id'].$delete({
      param: { organizationId, id: subjectId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subjects`);

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

export async function deleteAllSubjectsAction(
  organizationId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.subjects.$delete({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subjects`);

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
