'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  SaveOrganizationBodySchema,
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';

export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function createOrganization(
  dto: SaveOrganizationDTO
): Promise<OrganizationDTO> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations.$post({ json: dto });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }

  return await response.json();
}

export async function updateOrganization(
  organizationId: string,
  dto: SaveOrganizationDTO
): Promise<OrganizationDTO> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':id'].$patch({
    param: { id: organizationId },
    json: dto,
  });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }

  return await response.json();
}

export async function removeOrganization(
  organizationId: string
): Promise<void> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[':id'].$delete({
    param: { id: organizationId },
  });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }
}

export async function createOrganizationAction(
  dto: SaveOrganizationDTO
): Promise<ActionResponse<OrganizationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveOrganizationBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();

    const response = await client.api.organizations.$post({
      json: parsedInput.data,
    });
    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const organization = await response.json();

    revalidatePath('/organizations');

    return {
      success: true,
      data: organization,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
