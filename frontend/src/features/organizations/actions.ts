'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  OrganizationSchema,
  SaveOrganizationBodySchema,
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { fetchOrganizationById } from './queries';
import { type ActionResponse } from '@/types/actions';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';

export async function getOrganizationNameAction(
  organizationId: string
): Promise<ActionResponse<string>> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const org = await fetchOrganizationById(organizationId);

    if (!org) {
      return { success: false, message: 'Not found' };
    }

    return { success: true, data: org.name };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function createOrganizationAction(
  dto: SaveOrganizationDTO
): Promise<ActionResponse<OrganizationDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  const parsedInput = SaveOrganizationBodySchema.safeParse(dto);
  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations.$post({
      json: parsedInput.data,
    });
    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const organization = OrganizationSchema.parse(payload);

    revalidatePath('/organizations');

    return {
      success: true,
      message: tSuccess('created'),
      data: organization,
    };
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
  const tSuccess = await getTranslations('Common.success');

  const parsedInput = SaveOrganizationBodySchema.safeParse(dto);
  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
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

    const payload = await response.json();
    const organization = OrganizationSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath('/organizations');

    return {
      success: true,
      message: tSuccess('updated'),
      data: organization,
    };
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
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':id'].$delete({
      param: { id: organizationId },
    });
    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath('/organizations');

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
