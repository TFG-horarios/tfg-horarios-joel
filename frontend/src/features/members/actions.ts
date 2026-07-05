'use server';

import {
  type CreateMemberDTO,
  type UpdateMemberRoleDTO,
  type MemberDTO,
  MemberSchema,
  CreateMemberBodySchema,
  UpdateMemberRoleBodySchema,
  type MemberListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import {
  createApiResponseError,
  getActionErrorMessage,
} from '@/lib/api/errors';
import {
  fetchPaginatedMembers,
  fetchAllMembers,
  getOrganizationMemberRole,
} from './queries';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { type ActionResponse } from '@/types/actions';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';

export async function fetchPaginatedMembersAction(
  organizationId: string,
  query: MemberListQueryDTO,
  page: number
): Promise<PaginatedResponse<MemberDTO>> {
  return fetchPaginatedMembers(organizationId, { ...query, page });
}

export async function fetchAllMembersAction(
  organizationId: string
): Promise<MemberDTO[]> {
  try {
    return await fetchAllMembers(organizationId);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (All Members):', error);
    return [];
  }
}

export async function addMemberAction(
  organizationId: string,
  dto: CreateMemberDTO
): Promise<ActionResponse<MemberDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  const parsedInput = CreateMemberBodySchema.safeParse(dto);
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
    ]!.members.$post({
      param: { organizationId },
      json: parsedInput.data,
    });
    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    const payload = await response.json();
    const member = MemberSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      message: tSuccess('created'),
      data: member,
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function updateMemberRoleAction(
  organizationId: string,
  memberId: string,
  dto: UpdateMemberRoleDTO
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  const parsedInput = UpdateMemberRoleBodySchema.safeParse(dto);
  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.members[
      ':id'
    ]!.$patch({
      param: { organizationId, id: memberId },
      json: parsedInput.data,
    });
    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      message: tSuccess('updated'),
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function removeMemberAction(
  organizationId: string,
  memberId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.members[
      ':id'
    ]!.$delete({
      param: { organizationId, id: memberId },
    });
    if (!response.ok) {
      throw await createApiResponseError(response, tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      message: tSuccess('deleted'),
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}

export async function getOrganizationMemberRoleAction(
  organizationId: string
): Promise<ActionResponse<MemberDTO['role'] | null>> {
  const tErrors = await getTranslations('Common.errors');

  try {
    return {
      success: true,
      data: await getOrganizationMemberRole(organizationId),
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, tErrors('generic')),
    };
  }
}
