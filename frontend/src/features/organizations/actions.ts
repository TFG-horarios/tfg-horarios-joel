'use server';

import { revalidatePath } from 'next/cache';
import {
  OrganizationSchema,
  CreateOrganizationSchema,
  type CreateOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import type { Organization } from '@/types/organization';
import { api } from '@/lib/api';
import { getFieldErrors } from '@/lib/zod';
import { parseJsonResponse } from '@/lib/api-utils';

const apiClient = api as unknown as {
  api: {
    organizations: {
      $get: () => Promise<Response>;
      $post: (params: { json: CreateOrganizationDTO }) => Promise<Response>;
    };
  };
};

export type OrganizationActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  organization: Organization | null;
};

const initialState: OrganizationActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  organization: null,
};

export async function createOrganization(
  dto: CreateOrganizationDTO
): Promise<OrganizationDTO> {
  const response = await apiClient.api.organizations.$post({
    json: dto,
  });

  const payload = await parseJsonResponse(
    response,
    'Failed to create organization'
  );

  const parsed = OrganizationSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid organization data');
  }

  return parsed.data;
}

export async function fetchOrganizations(): Promise<OrganizationDTO[]> {
  const response = await apiClient.api.organizations.$get();

  if (response.status === 401) {
    return [];
  }

  const payload = await parseJsonResponse(
    response,
    'Failed to fetch organizations'
  );

  const parsed = OrganizationSchema.array().safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid organization data');
  }

  return parsed.data;
}

export async function createOrganizationAction(
  _prevState: OrganizationActionState,
  formData: FormData
): Promise<OrganizationActionState> {
  const raw = Object.fromEntries(formData);
  const parsedInput = CreateOrganizationSchema.safeParse({
    ...raw,
    slotDurationMinutes: Number(raw.slotDurationMinutes),
  });

  if (!parsedInput.success) {
    return {
      ...initialState,
      message: 'Revisa los campos e intenta de nuevo.',
      fieldErrors: getFieldErrors(parsedInput.error),
    };
  }

  try {
    const organization = await createOrganization(parsedInput.data);

    revalidatePath('/organizations');

    return {
      success: true,
      message: 'Organización creada exitosamente',
      fieldErrors: {},
      organization,
    };
  } catch (error) {
    return {
      ...initialState,
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo crear la organización',
    };
  }
}
