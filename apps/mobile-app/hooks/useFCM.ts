import { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { useRouter, usePathname } from 'expo-router';

import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

type DeviceType = 'ios' | 'android';

interface PushData {
  type?: string;
  notification_id?: string;
  event_id?: string;
  convo_id?: string;
  sender_id?: string;
}

function getDeviceType(): DeviceType {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

// ── Permission ─────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// ── Token management ───────────────────────────────────────

async function upsertToken(userId: string, token: string): Promise<void> {
  await supabase.from('user_devices').upsert(
    {
      user_id: userId,
      fcm_token: token,
      device_type: getDeviceType(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'fcm_token' },
  );
}

async function removeToken(token: string): Promise<void> {
  await supabase.from('user_devices').delete().eq('fcm_token', token);
}

async function cleanupOnSignOut(token: string | null): Promise<void> {
  if (token) {
    await removeToken(token);
  }
  try {
    await messaging().deleteToken();
  } catch {
    // Token may already be invalid
  }
}

// ── Navigation ─────────────────────────────────────────────

function navigateFromPush(
  router: ReturnType<typeof useRouter>,
  data: PushData,
): void {
  switch (data.type) {
    case 'dm_message':
      if (data.convo_id) router.push(`/people/${data.convo_id}` as never);
      break;
    case 'group_invite':
    case 'new_post':
      if (data.convo_id) router.push(`/groups/${data.convo_id}` as never);
      break;
    case 'comment':
    case 'mention':
      if (data.convo_id && data.event_id) {
        router.push(
          `/groups/${data.convo_id}?scrollTo=${data.event_id}&openComments=true` as never,
        );
      } else if (data.convo_id) {
        router.push(`/groups/${data.convo_id}` as never);
      }
      break;
    case 'like':
    case 'must_read':
    case 'co_engaged':
    case 'must_read_broadcast':
      if (data.convo_id && data.event_id) {
        router.push(
          `/groups/${data.convo_id}?scrollTo=${data.event_id}` as never,
        );
      } else if (data.convo_id) {
        router.push(`/groups/${data.convo_id}` as never);
      }
      break;
  }
}

function shouldSuppressForeground(
  data: PushData,
  currentPath: string,
): boolean {
  if (data.type === 'dm_message' && data.convo_id) {
    return currentPath.includes(`/people/${data.convo_id}`);
  }
  if (data.type === 'new_post' && data.convo_id) {
    return currentPath.includes(`/groups/${data.convo_id}`);
  }
  return false;
}

// ── Main hook ──────────────────────────────────────────────

export function useFCM(): void {
  const userId = useAuthStore(state => state.userId);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const tokenRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // Keep pathname ref current for foreground handler
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Sign-out cleanup: when userId goes from value → null, remove token
  useEffect(() => {
    if (prevUserIdRef.current && !userId) {
      void cleanupOnSignOut(tokenRef.current);
      tokenRef.current = null;
    }
    prevUserIdRef.current = userId ?? null;
  }, [userId]);

  // Main FCM setup
  useEffect(() => {
    if (!userId) return;

    let unsubForeground: (() => void) | undefined;
    let unsubTokenRefresh: (() => void) | undefined;
    let unsubNotificationOpen: (() => void) | undefined;

    const setup = async () => {
      const granted = await requestPermission();
      if (!granted) return;

      // Get and store FCM token
      const token = await messaging().getToken();
      tokenRef.current = token;
      await upsertToken(userId, token);

      // Token refresh listener
      unsubTokenRefresh = messaging().onTokenRefresh(async newToken => {
        if (tokenRef.current && tokenRef.current !== newToken) {
          await removeToken(tokenRef.current);
        }
        tokenRef.current = newToken;
        await upsertToken(userId, newToken);
      });

      // Foreground message handler
      unsubForeground = messaging().onMessage(
        async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          const data = (remoteMessage.data ?? {}) as PushData;

          // Suppress if user is viewing the relevant screen
          if (shouldSuppressForeground(data, pathnameRef.current)) return;

          // For foreground, the OS does NOT show a notification banner automatically.
          // We rely on the in-app realtime subscription to update the UI.
        },
      );

      // Background tap — app was in background, user tapped notification
      unsubNotificationOpen = messaging().onNotificationOpenedApp(
        (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          const data = (remoteMessage.data ?? {}) as PushData;
          navigateFromPush(router, data);
        },
      );

      // Cold start — app was killed, opened via notification tap
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        const data = (initialNotification.data ?? {}) as PushData;
        setTimeout(() => navigateFromPush(router, data), 500);
      }
    };

    void setup();

    return () => {
      unsubForeground?.();
      unsubTokenRefresh?.();
      unsubNotificationOpen?.();
    };
  }, [userId, router]);
}
