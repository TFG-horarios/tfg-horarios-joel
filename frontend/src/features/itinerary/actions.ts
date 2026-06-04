'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ItinerarySchema,
  SaveItineraryBodySchema,
  type ItineraryDTO,
  type SaveItineraryDTO,
  type BulkSaveItineraryDTO,
  type ItineraryIdentifierDTO,
  type ItineraryListQueryDTO,
} from '@tfg-horarios/shared';
import { fetchItineraries } from './queries';
import { getServerClient } from '@/lib/api/server';
import { type ActionResponse } from '@/types/actions';

export async function fetchItinerariesAction(
  organizationId: string,
  query: ItineraryListQueryDTO,
  page: number
) {
  return fetchItineraries(organizationId, { ...query, page });
}

export async function bulkCreateItineraries(
  organizationId: string,
  dtos: BulkSaveItineraryDTO[]
): Promise<ActionResponse<ItineraryDTO[]>> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.bulk.$post({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Itinerarios):', errorText);
      return { success: false, message: t('server') };
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/itineraries`);

    return {
      success: true,
      data: ItinerarySchema.array().parse(payload),
    };
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Itinerarios Bulk):', error);
    return { success: false, message: t('server') };
  }
}

export async function replaceItinerariesAction(
  organizationId: string,
  dtos: BulkSaveItineraryDTO[]
): Promise<ActionResponse<ItineraryDTO[]>> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.bulk.$put({
      param: { organizationId },
      json: dtos,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR DEL BACKEND DE HONO (Itinerarios Replace):', errorText);
      return { success: false, message: t('server') };
    }

    const payload = await response.json();
    revalidatePath(`/organizations/${organizationId}/itineraries`);
    return {
      success: true,
      data: ItinerarySchema.array().parse(payload),
    };
  } catch (error) {
    console.error('ERROR EN EL SERVER ACTION (Itinerarios Replace):', error);
    return { success: false, message: t('server') };
  }
}

export async function createItineraryAction(
  organizationId: string,
  degreeId: string,
  dto: SaveItineraryDTO
): Promise<ActionResponse<ItineraryDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveItineraryBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.degrees[
      ':degreeId'
    ]!.itineraries.$post({
      param: { organizationId, degreeId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const itinerary = ItinerarySchema.parse(payload);

    revalidatePath(
      `/organizations/${organizationId}/degrees/${degreeId}/itineraries`
    );

    return {
      success: true,
      message: tSuccess('created'),
      data: itinerary,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateItineraryAction(
  organizationId: string,
  degreeId: string,
  itineraryId: string,
  dto: SaveItineraryDTO
): Promise<ActionResponse<ItineraryDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveItineraryBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries[':id']!.$patch({
      param: { organizationId, id: itineraryId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const itinerary = ItinerarySchema.parse(payload);

    revalidatePath(
      `/organizations/${organizationId}/degrees/${degreeId}/itineraries`
    );

    return { success: true, data: itinerary };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteItineraryAction(
  organizationId: string,
  degreeId: string,
  itineraryId: string
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries[':id']!.$delete({
      param: { organizationId, id: itineraryId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(
      `/organizations/${organizationId}/degrees/${degreeId}/itineraries`
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteAllItinerariesAction(
  organizationId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.$delete({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}/itineraries`);

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

export async function getItineraryIdentifiersAction(
  organizationId: string
): Promise<ItineraryIdentifierDTO[]> {
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.identifiers.$get({
      param: { organizationId },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch itinerary identifiers');
    }

    const payload = await response.json();
    return payload;
  } catch (error) {
    console.error(
      'ERROR EN EL SERVER ACTION (Itineraries Identifiers):',
      error
    );
    return [];
  }
}
