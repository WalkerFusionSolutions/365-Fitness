import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  unsubscribe,
} from '@/services/notifications.service';
import { AppServiceError } from '@/services/errors';
import { Notification } from '@/types';

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

export function useNotifications(userId?: string) {
  const [data, setData] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async (refreshing = false) => {
    if (!userId) return;

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [notifications, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      if (requestId.current === currentRequest) {
        setData(notifications);
        setUnreadCount(count);
      }
    } catch (loadError) {
      console.error('Unable to load notifications:', loadError);
      if (requestId.current === currentRequest) {
        setError(getUserMessage(loadError, 'Unable to load notifications.'));
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = subscribeToNotifications({
      onInsert: () => {
        void refresh(true);
      },
      userId,
    });

    return () => {
      unsubscribe(channel);
    };
  }, [refresh, userId]);

  const markRead = useCallback(
    async (notificationId: string) => {
      await markNotificationRead(notificationId);
      await refresh(true);
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    await refresh(true);
  }, [refresh]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    markAllRead,
    markRead,
    refresh: useCallback(() => refresh(true), [refresh]),
    unreadCount,
  };
}
