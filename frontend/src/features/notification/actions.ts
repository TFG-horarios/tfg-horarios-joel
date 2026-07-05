'use server';

import { getServerClient } from '@/lib/api/server';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import {
  NotificationSchema,
  type NotificationDTO,
  type NotificationListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';
import { fetchPaginatedNotifications } from './queries';
import { type ActionResponse } from '@/types/actions';
import { getSessionUser } from '@/features/auth/queries';

async function assertCurrentUser(userId: string): Promise<boolean> {
  const sessionUser = await getSessionUser();
  return sessionUser?.id === userId;
}

export async function fetchPaginatedNotificationsAction(
  userId: string,
  query: NotificationListQueryDTO
): Promise<PaginatedResponse<NotificationDTO>> {
  if (!(await assertCurrentUser(userId))) {
    return {
      data: [],
      meta: {
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: 0,
      },
    };
  }

  return fetchPaginatedNotifications(userId, query);
}

export async function markNotificationReadAction(
  userId: string,
  notificationId: string
): Promise<ActionResponse<NotificationDTO>> {
  const tErrors = await getTranslations('Common.errors');

  try {
    if (!(await assertCurrentUser(userId))) {
      return {
        success: false,
        message: tErrors('server'),
      };
    }

    const client = await getServerClient();
    const response = await client.api.users[':userId']!.notifications[
      ':id'
    ]!.read.$patch({
      param: { userId, id: notificationId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const parsed = NotificationSchema.parse(payload);

    revalidatePath('/', 'layout');

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function markAllNotificationsReadAction(
  userId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');

  try {
    if (!(await assertCurrentUser(userId))) {
      return {
        success: false,
        message: tErrors('server'),
      };
    }

    const client = await getServerClient();
    const response = await client.api.users[':userId']!.notifications[
      'read-all'
    ].$patch({
      param: { userId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
