import { useEffect, useRef, useState } from 'react';
import {
  addForegroundNotificationListener,
  addNotificationResponseListener,
  getLastNotificationResponseData,
  registerPushDevice,
  PushRegistrationResult,
} from '@/services/push.service';

export type NotificationNavigationHandler = (
  data: Record<string, unknown>
) => void;

export function usePushNotifications({
  onForegroundNotification,
  onNotificationResponse,
  userId,
}: {
  onForegroundNotification?: () => void;
  onNotificationResponse?: NotificationNavigationHandler;
  userId?: string;
}) {
  const [registration, setRegistration] =
    useState<PushRegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didRegisterForUserRef = useRef<string | null>(null);
  const handledInitialResponseRef = useRef(false);

  useEffect(() => {
    if (!userId || didRegisterForUserRef.current === userId) return;

    didRegisterForUserRef.current = userId;
    registerPushDevice(userId)
      .then((result) => {
        setRegistration(result);
        setError(null);
      })
      .catch((registrationError) => {
        console.error('Unable to register push notifications:', registrationError);
        setError('Unable to register this device for notifications.');
      });
  }, [userId]);

  useEffect(() => {
    const foregroundSubscription = addForegroundNotificationListener(() => {
      onForegroundNotification?.();
    });

    const responseSubscription = addNotificationResponseListener((data) => {
      onNotificationResponse?.(data);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [onForegroundNotification, onNotificationResponse]);

  useEffect(() => {
    if (!userId || !onNotificationResponse || handledInitialResponseRef.current) {
      return;
    }

    handledInitialResponseRef.current = true;
    getLastNotificationResponseData().then((data) => {
      if (data) {
        onNotificationResponse(data as Record<string, unknown>);
      }
    });
  }, [onNotificationResponse, userId]);

  return { error, registration };
}
