'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Bell, Check } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  fetchPaginatedNotificationsAction,
} from '../actions';
import { NotificationSchema, type NotificationDTO } from '@tfg-horarios/shared';
import { createApiEventSource, parseEventData } from '@/lib/api/realtime';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

export function NotificationBell() {
  const { user } = useSession();
  const locale = useLocale();
  const t = useTranslations('Notifications');
  const dateFnsLocale = locale === 'en' ? enUS : es;
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchPaginatedNotificationsAction(user.id, {
        page: 1,
        limit: 10,
      });
      setNotifications(res.data);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (open && !hasFetched) {
      void fetchNotifications();
    }
  }, [fetchNotifications, hasFetched, open]);

  useEffect(() => {
    if (!user) return;

    const eventSource = createApiEventSource(
      `/api/users/${user.id}/notifications/stream`
    );

    eventSource.addEventListener('notification_received', (e) => {
      try {
        const newNotification = parseEventData(e, NotificationSchema);
        setNotifications((prev) => [newNotification, ...prev]);

        if (newNotification.type === 'SUCCESS')
          toast.success(newNotification.title, {
            description: newNotification.message,
          });
        else if (
          newNotification.type === 'ERROR' ||
          newNotification.type === 'WARNING'
        )
          toast.error(newNotification.title, {
            description: newNotification.message,
          });
        else
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
      } catch (err) {
        console.error('Failed to parse SSE notification', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      const result = await markNotificationReadAction(user.id, id);
      if (!result.success) throw new Error(result.message);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
      toast.error(t('markReadError'));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const result = await markAllNotificationsReadAction(user.id);
      if (!result.success) throw new Error(result.message);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
      toast.error(t('markAllReadError'));
    }
  };

  if (!user) return null;

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative size-9 cursor-pointer bg-card border-border dark:border-border dark:bg-input/30"
      >
        <Bell className="size-4" />
      </Button>
    );
  }

  const triggerButton = (
    <Button
      variant="outline"
      size="icon"
      className="relative size-9 cursor-pointer bg-card border-border dark:border-border dark:bg-input/30"
    >
      <Bell className="size-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  const notificationContent = (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h4 className="font-semibold">{t('title')}</h4>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
            onClick={markAllAsRead}
          >
            <Check className="mr-1 h-3 w-3" />
            {t('markAll')}
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px]">
        {!hasFetched ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {t('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {t('empty')}
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex cursor-pointer flex-col gap-1 rounded-md p-3 text-sm transition-colors hover:bg-muted ${
                  !notification.isRead ? 'bg-muted/50' : ''
                }`}
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium leading-none">
                    {notification.title}
                  </span>
                  {!notification.isRead && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="text-[10px] text-muted-foreground/80 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: dateFnsLocale,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] p-0 sm:w-80"
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
      >
        {notificationContent}
      </PopoverContent>
    </Popover>
  );
}
