'use server';

import {
  type CreateMemberDTO,
  type UpdateMemberRoleDTO,
  type MemberDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';

export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function addMember(
  organizationId: string,
  dto: CreateMemberDTO
): Promise<MemberDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    organizationId
  ]!.members.$post({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return MemberSchema.parse(payload);
}

export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  dto: UpdateMemberRoleDTO
): Promise<void> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.members[
    memberId
  ]!.$patch({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }
}

export async function removeMember(
  organizationId: string,
  memberId: string
): Promise<void> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.members[
      memberId
    ]!.$delete();

  if (!response.ok) {
    throw new Error(t('server'));
  }
}
