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
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await response.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (e) {
        void e;
      }
      throw new Error(responseMessage);
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
      message: error instanceof Error ? error.message : tErrors('generic'),
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
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await response.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (e) {
        void e;
      }
      throw new Error(responseMessage);
    }

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      message: tSuccess('updated'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
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
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await response.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (e) {
        void e;
      }
      throw new Error(responseMessage);
    }

    revalidatePath(`/organizations/${organizationId}/members`);

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

export async function getOrganizationMemberRoleAction(
  organizationId: string,
  userId: string
): Promise<string | null> {
  try {
    return await getOrganizationMemberRole(organizationId, userId);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Member Role):', error);
    return null;
  }
}
