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
import { type ActionResponse } from '@/types/actions';

export async function bulkCreateDegrees(
  organizationId: string,
  dtos: SaveDegreeDTO[]
): Promise<DegreeDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.bulk.$post({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Grados):', errorText);
      throw new Error(t('server'));
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/degrees`);

    return DegreeSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Grados Bulk):', error);
    throw error;
  }
}

export async function replaceDegreesAction(
  organizationId: string,
  dtos: SaveDegreeDTO[]
): Promise<DegreeDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.bulk.$put({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Grados Replace):', errorText);
      throw new Error(t('server'));
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/degrees`);
    return DegreeSchema.array().parse(payload);
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Grados Replace):', error);
    throw error;
  }
}

export async function createDegreeAction(
  organizationId: string,
  dto: SaveDegreeDTO
): Promise<ActionResponse<DegreeDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveDegreeBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const degree = DegreeSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/degrees`);

    return {
      success: true,
      message: tSuccess('created'),
      data: degree,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateDegreeAction(
  organizationId: string,
  degreeId: string,
  dto: SaveDegreeDTO
): Promise<ActionResponse<DegreeDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveDegreeBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.degrees[
      ':id'
    ]!.$patch({
      param: { organizationId, id: degreeId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const degree = DegreeSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}/degrees/${degreeId}`);
    revalidatePath(`/organizations/${organizationId}/degrees`);

    return { success: true, data: degree };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteDegreeAction(
  organizationId: string,
  degreeId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.degrees[
      ':id'
    ]!.$delete({
      param: { organizationId, id: degreeId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/degrees`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteAllDegreesAction(
  organizationId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.degrees.$delete({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/degrees`);

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
