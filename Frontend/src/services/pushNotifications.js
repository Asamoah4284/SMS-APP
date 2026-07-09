import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android channel for school announcements (FCM delivers into this channel). */
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'School announcements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/**
 * Request permission, obtain Expo push token (FCM on Android / APNs on iOS via EAS),
 * and register with the backend.
 */
export async function registerForPushNotifications(token) {
  if (!token) return null;

  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const pushToken = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  const expoToken = pushToken.data;
  if (!expoToken) return null;

  try {
    await apiFetch('/portal/push/register', token, {
      method: 'POST',
      body: JSON.stringify({
        token: expoToken,
        platform: Platform.OS,
      }),
    });
  } catch (err) {
    console.warn('Push token registration failed:', err?.message);
  }

  return expoToken;
}

export async function unregisterPushToken(authToken, expoToken) {
  if (!authToken || !expoToken) return;
  try {
    await apiFetch('/portal/push/unregister', authToken, {
      method: 'POST',
      body: JSON.stringify({ token: expoToken }),
    });
  } catch {
    // ignore
  }
}

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}
