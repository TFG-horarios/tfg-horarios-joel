'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ItinerarySchema,
  SaveItineraryBodySchema,
  type ItineraryDTO,
  type SaveItineraryDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { getFieldErrors } from '@/lib/zod';

export async function createItinerary(
  organizationId: string,
  degreeId: string,
  dto: SaveItineraryDTO
): Promise<ItineraryDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.degrees[
    degreeId
  ]!.itineraries.$post({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ItinerarySchema.parse(payload);
}

export async function bulkCreateItineraries(
  organizationId: string,
  degreeId: string,
  dtos: SaveItineraryDTO[]
): Promise<ItineraryDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[organizationId]!.degrees[
      degreeId
    ]!.itineraries.bulk.$post({
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR DEL BACKEND DE HONO (Itinerarios):', errorText);
      throw new Error(t('server'));
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/itineraries`);

    return ItinerarySchema.array().parse(payload);
  } catch (error) {
    console.error('❌ ERROR EN EL SERVER ACTION (Itinerarios Bulk):', error);
    throw error;
  }
}

export async function updateItinerary(
  organizationId: string,
  itineraryId: string,
  dto: SaveItineraryDTO
): Promise<ItineraryDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.itineraries[
    itineraryId
  ]!.$patch({
    json: dto,
  });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return ItinerarySchema.parse(payload);
}

export async function removeItinerary(
  organizationId: string,
  itineraryId: string
): Promise<void> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.itineraries[
      itineraryId
    ]!.$delete();

  if (!response.ok) {
    throw new Error(t('server'));
  }
}

export type ItineraryActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  itinerary: ItineraryDTO | null;
};

export async function createItineraryAction(
  organizationId: string,
  degreeId: string,
  _prevState: ItineraryActionState,
  formData: FormData
): Promise<ItineraryActionState> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const raw = Object.fromEntries(formData);
  const parsedInput = SaveItineraryBodySchema.safeParse(raw);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      fieldErrors: getFieldErrors(parsedInput.error),
      itinerary: null,
    };
  }

  try {
    const itinerary = await createItinerary(
      organizationId,
      degreeId,
      parsedInput.data
    );
    revalidatePath(
      `/organizations/${organizationId}/degrees/${degreeId}/itineraries`
    );

    return {
      success: true,
      message: tSuccess('created'),
      fieldErrors: {},
      itinerary,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
      fieldErrors: {},
      itinerary: null,
    };
  }
}
