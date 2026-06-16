'use server';

import {
  type CreateMemberDTO,
  type UpdateMemberRoleDTO,
  type MemberDTO,
  MemberSchema,
  CreateMemberBodySchema,
  UpdateMemberRoleBodySchema,
  type MemberListQueryDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { fetchMembers } from './queries';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';

import { type ActionResponse } from '@/types/actions';

export async function fetchMembersAction(
  organizationId: string,
  query: MemberListQueryDTO,
  page: number
) {
  return fetchMembers(organizationId, { ...query, page });
}

export async function addMemberAction(
  organizationId: string,
  dto: CreateMemberDTO
): Promise<ActionResponse<MemberDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = CreateMemberBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
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

    return { success: true, message: tSuccess('created'), data: member };
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
  const parsedInput = UpdateMemberRoleBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
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

    return { success: true };
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
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
