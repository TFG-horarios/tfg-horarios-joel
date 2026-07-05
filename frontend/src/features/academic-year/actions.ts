'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  AcademicYearSchema,
  SaveAcademicYearBodySchema,
  type SaveAcademicYearBodyDTO,
  type AcademicYearDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';
import { type ActionResponse } from '@/types/actions';

export async function createAcademicYearAction(
  organizationId: string,
  dto: SaveAcademicYearBodyDTO
): Promise<ActionResponse<AcademicYearDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveAcademicYearBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ].$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const academicYear = AcademicYearSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`);

    return {
      success: true,
      message: tSuccess('created'),
      data: academicYear,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateAcademicYearAction(
  organizationId: string,
  academicYearId: string,
  dto: SaveAcademicYearBodyDTO
): Promise<ActionResponse<AcademicYearDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveAcademicYearBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':id'].$put({
      param: { organizationId, id: academicYearId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const academicYear = AcademicYearSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(
      `/organizations/${organizationId}/academic-years/${academicYearId}`
    );

    return {
      success: true,
      message: tSuccess('updated'),
      data: academicYear,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteAcademicYearAction(
  organizationId: string,
  academicYearId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']![
      'academic-years'
    ][':id'].$delete({
      param: { organizationId, id: academicYearId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}`);

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
