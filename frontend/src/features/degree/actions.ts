'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  DegreeSchema,
  SaveDegreeBodySchema,
  type DegreeDTO,
  type SaveDegreeDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { getFieldErrors } from '@/lib/zod';

export async function createDegree(
  organizationId: string,
  dto: SaveDegreeDTO
): Promise<DegreeDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[
    organizationId
  ]!.degrees.$post({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return DegreeSchema.parse(payload);
}

export async function bulkCreateDegrees(
  organizationId: string,
  dtos: SaveDegreeDTO[]
): Promise<DegreeDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      organizationId
    ]!.degrees.bulk.$post({
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR DEL BACKEND DE HONO (Grados):', errorText);
      throw new Error(t('server'));
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/degrees`);

    return DegreeSchema.array().parse(payload);
  } catch (error) {
    console.error('❌ ERROR EN EL SERVER ACTION (Grados Bulk):', error);
    throw error;
  }
}

export async function updateDegree(
  organizationId: string,
  degreeId: string,
  dto: SaveDegreeDTO
): Promise<DegreeDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.degrees[
    degreeId
  ]!.$patch({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return DegreeSchema.parse(payload);
}

export async function removeDegree(
  organizationId: string,
  degreeId: string
): Promise<void> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.degrees[
      degreeId
    ]!.$delete();

  if (!response.ok) {
    throw new Error(t('server'));
  }
}

export type DegreeActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  degree: DegreeDTO | null;
};

export async function createDegreeAction(
  organizationId: string,
  _prevState: DegreeActionState,
  formData: FormData
): Promise<DegreeActionState> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const raw = Object.fromEntries(formData);
  const parsedInput = SaveDegreeBodySchema.safeParse(raw);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      fieldErrors: getFieldErrors(parsedInput.error),
      degree: null,
    };
  }

  try {
    const degree = await createDegree(organizationId, parsedInput.data);
    revalidatePath(`/organizations/${organizationId}/degrees`);

    return {
      success: true,
      message: tSuccess('created'),
      fieldErrors: {},
      degree,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
      fieldErrors: {},
      degree: null,
    };
  }
}
