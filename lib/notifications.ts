import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const PUSH_TOKEN_KEY = "expo_push_token_v1";

// ─── Expo Go detection ────────────────────────────────────────────────────────
// expo-notifications remote push was removed from Expo Go in SDK 53.
// Local notifications still work in development builds.
// We guard all Notifications calls to avoid the hard ERROR in Expo Go.
const IS_EXPO_GO =
  Constants.appOwnership === "expo" ||
  // fallback for older Constants shape
  (Constants as Record<string, unknown>).executionEnvironment === "storeClient";

// ─── Default Handler ──────────────────────────────────────────────────────────
// Set at module level so it's registered before any notification can arrive.
// Wrapped in try/catch so Expo Go doesn't hard-crash the app.
try {
  if (!IS_EXPO_GO) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // Silently skip — running inside Expo Go
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

export type PermissionStatus = "granted" | "denied" | "undetermined";

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === "web" || IS_EXPO_GO) return "denied";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PermissionStatus;
  } catch {
    return "denied";
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === "web" || IS_EXPO_GO) return false;
  try {
    const existing = await getPermissionStatus();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// ─── Push Token ───────────────────────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web" || IS_EXPO_GO) return null;
  if (!Device.isDevice) return null;

  const granted = await requestPermissions();
  if (!granted) return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      ((Constants as Record<string, unknown>)?.easConfig as { projectId?: string } | undefined)?.projectId ??
      undefined;

    const tokenObj = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, tokenObj.data);
    return tokenObj.data;
  } catch {
    return null;
  }
}

export async function getCachedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// ─── Local Notification Helpers ───────────────────────────────────────────────

/** Fire an immediate local notification (works without a server). */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (Platform.OS === "web" || IS_EXPO_GO) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
    return id;
  } catch {
    return null;
  }
}

/** Schedule a notification N seconds from now. */
export async function sendDelayedNotification(
  title: string,
  body: string,
  seconds: number,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (Platform.OS === "web" || IS_EXPO_GO) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: {
        seconds,
        repeats: false,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/** Cancel all pending scheduled notifications. */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web" || IS_EXPO_GO) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

// ─── Sample Breaking-News Notification ───────────────────────────────────────

export async function sendBreakingNewsDemo(): Promise<void> {
  await sendLocalNotification(
    "🔴 Breaking News",
    "తాజా వార్తలు: అత్యంత ముఖ్యమైన వార్త అందింది — Telugu E-Newspaper చదవండి.",
    { screen: "news", category: "Top" }
  );
}
