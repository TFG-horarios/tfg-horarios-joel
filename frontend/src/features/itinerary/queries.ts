import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  ItinerarySchema,
  ItineraryIdentifierSchema,
  createPaginatedSchema,
  type ItineraryDTO,
  type ItineraryListQueryDTO,
  type PaginatedResponse,
  type ItineraryIdentifierDTO,
} from '@tfg-horarios/shared';

export const fetchPaginatedItineraries = cache(
  async (
    organizationId: string,
    query?: ItineraryListQueryDTO
  ): Promise<PaginatedResponse<ItineraryDTO>> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.$get({
      param: { organizationId },
      query: query || {},
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      };
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(ItinerarySchema);
    return schema.parse(payload);
  }
);

export const fetchAllItineraries = cache(
  async (organizationId: string): Promise<ItineraryDTO[]> => {
    const t = await getTranslations('Common.errors');

    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.all.$get({
      param: { organizationId },
    });
    if (!response.ok) {
      throw new Error(t('server'));
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return ItinerarySchema.array().parse(payload);
  }
);

export const fetchItineraryIdentifiers = cache(
  async (organizationId: string): Promise<ItineraryIdentifierDTO[]> => {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.itineraries.identifiers.$get({
      param: { organizationId },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch itinerary identifiers');
    }

    const status = response.status + 0;
    if (status === 401 || status === 403) {
      return [];
    }

    const payload = await response.json();
    return ItineraryIdentifierSchema.array().parse(payload);
  }
);
