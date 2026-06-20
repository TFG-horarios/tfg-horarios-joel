import { cache } from 'react';
import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import {
  NotificationSchema,
  createPaginatedSchema,
  type NotificationDTO,
  type NotificationListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export const fetchPaginatedNotifications = cache(
  async (
    userId: string,
    query?: NotificationListQueryDTO
  ): Promise<PaginatedResponse<NotificationDTO>> => {
    const t = await getTranslations('Common.errors');
    const client = await getServerClient();

    const response = await client.api.users[':userId']!.notifications.$get({
      param: { userId },
      query: query || {},
    });

    const status = response.status + 0;

    if (status === 401 || status === 403) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();
    const schema = createPaginatedSchema(NotificationSchema);
    return schema.parse(payload);
  }
);
