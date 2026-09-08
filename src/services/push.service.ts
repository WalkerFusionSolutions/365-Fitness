import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AppServiceError, throwIfSupabaseError } from '@/services/errors';
import { supabase } from '@/services/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'skipped'; reason: string }
  | { status: 'denied'; reason: string };

export async function registerPushDevice(
  userId: string
): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      status: 'skipped',
      reason: 'Push notifications require a physical device or supported native simulator.',
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Appointments',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#18A88F',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  const promptKey = `push-permission-requested:${userId}`;
  const hasRequestedPermission = await AsyncStorage.getItem(promptKey);

  if (
    existing.status !== 'granted' &&
    existing.canAskAgain &&
    !hasRequestedPermission
  ) {
    await AsyncStorage.setItem(promptKey, 'true');
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return {
      status: 'denied',
      reason: 'Notification permission was not granted.',
    };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      status: 'skipped',
      reason: 'EAS project ID is required before push tokens can be registered.',
    };
  }

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    const now = new Date().toISOString();
    const { error } = await supabase.from('push_devices').upsert(
      {
        expo_push_token: token,
        is_active: true,
        last_seen_at: now,
        platform: getPlatform(),
        updated_at: now,
        user_id: userId,
      },
      { onConflict: 'user_id,expo_push_token' }
    );

    throwIfSupabaseError(error, 'Unable to register this device for notifications.');

    return { status: 'registered', token };
  } catch (error) {
    if (error instanceof AppServiceError) {
      throw error;
    }

    throw new AppServiceError(
      'Unable to register this device for notifications.',
      error
    );
  }
}

export function addForegroundNotificationListener(
  onNotification: () => void
) {
  return Notifications.addNotificationReceivedListener(() => {
    onNotification();
  });
}

export function addNotificationResponseListener(
  onResponse: (data: Record<string, unknown>) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse(response.notification.request.content.data ?? {});
  });
}

export async function getLastNotificationResponseData() {
  const response = await Notifications.getLastNotificationResponseAsync();
  return response?.notification.request.content.data ?? null;
}

function getPlatform() {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'unknown';
}
