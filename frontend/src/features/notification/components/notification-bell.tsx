'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  fetchPaginatedNotificationsAction,
} from '../actions';
import type { NotificationDTO } from '@tfg-horarios/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const { user } = useSession();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchPaginatedNotificationsAction(user.id, {
        page: 1,
        limit: 50,
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/users/${user.id}/notifications/stream`,
      { withCredentials: true }
    );

    eventSource.addEventListener('notification_received', (e) => {
      try {
        const newNotification = JSON.parse(e.data) as NotificationDTO;
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

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
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
      toast.error('Error al marcar como leída');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const result = await markAllNotificationsReadAction(user.id);
      if (!result.success) throw new Error(result.message);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
      toast.error('Error al marcar todas como leídas');
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
        <h4 className="font-semibold">Notificaciones</h4>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
            onClick={markAllAsRead}
          >
            <Check className="mr-1 h-3 w-3" />
            Marcar todas
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No tienes notificaciones
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
                    locale: es,
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
    <>
      <div className="hidden md:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            {notificationContent}
          </PopoverContent>
        </Popover>
      </div>

      <div className="block md:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-80 p-0 rounded-2xl overflow-hidden gap-0">
            <DialogTitle className="sr-only">Notificaciones</DialogTitle>
            {notificationContent}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
