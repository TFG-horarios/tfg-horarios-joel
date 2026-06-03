'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  SaveOrganizationBodySchema,
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';

import { type ActionResponse } from '@/types/actions';

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
    return { success: true, data: organization };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateOrganizationAction(
  organizationId: string,
  dto: SaveOrganizationDTO
): Promise<ActionResponse<OrganizationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveOrganizationBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':id'].$patch({
      param: { id: organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const organization = await response.json();

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath('/organizations');

    return { success: true, data: organization };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function removeOrganizationAction(
  organizationId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':id'].$delete({
      param: { id: organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath('/organizations');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function getOrganizationNameAction(
  organizationId: string
): Promise<ActionResponse<string>> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':id'].$get({
      param: { id: organizationId },
    });

    if (response.status === 404) {
      return { success: false, message: 'Not found' };
    }
    
    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const org = await response.json();
    return { success: true, data: org.name };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
