'use server';

import {
  SubjectGroupSchema,
  SaveSubjectGroupBodySchema,
  type SubjectGroupDTO,
  type SaveSubjectGroupDTO,
  type BulkSaveSubjectGroupDTO,
  type SubjectGroupListQueryDTO,
  type SubjectGroupIdentifierDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  fetchPaginatedSubjectGroups,
  fetchAllSubjectGroups,
  fetchSubjectGroupIdentifiers,
} from './queries';
import { type ActionResponse } from '@/types/actions';

export async function fetchPaginatedSubjectGroupsAction(
  organizationId: string,
  query: SubjectGroupListQueryDTO,
  page: number
): Promise<PaginatedResponse<SubjectGroupDTO>> {
  return fetchPaginatedSubjectGroups(organizationId, { ...query, page });
}

export async function fetchAllSubjectGroupsAction(
  organizationId: string,
): Promise<SubjectGroupDTO[]> {
  return fetchAllSubjectGroups(organizationId);
}

export async function fetchSubjectGroupIdentifiersAction(
  organizationId: string
): Promise<SubjectGroupIdentifierDTO[]> {
  return fetchSubjectGroupIdentifiers(organizationId);
}

export async function bulkCreateSubjectGroups(
  organizationId: string,
  dtos: BulkSaveSubjectGroupDTO[]
): Promise<ActionResponse<SubjectGroupDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].bulk.$post({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return {
      success: true,
      message: tSuccess('created'),
      data: SubjectGroupSchema.array().parse(payload),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function replaceSubjectGroupsAction(
  organizationId: string,
  dtos: BulkSaveSubjectGroupDTO[]
): Promise<ActionResponse<SubjectGroupDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].bulk.$put({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return {
      success: true,
      message: tSuccess('updated'),
      data: SubjectGroupSchema.array().parse(payload),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
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
  const tSuccess = await getTranslations('Common.success');

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

    return { success: true, message: tSuccess('updated'), data: subjectGroup };
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
  const tSuccess = await getTranslations('Common.success');

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
    return { success: true, message: tSuccess('deleted') };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteSubjectGroupAction(
  organizationId: string,
  subjectGroupId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ][':id'].$delete({
      param: { organizationId, id: subjectGroupId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subject-groups`);

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

export async function deleteAllSubjectGroupsAction(
  organizationId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'subject-groups'
    ].$delete({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/subject-groups`);

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
