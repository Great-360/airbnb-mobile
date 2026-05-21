// src/hooks/useNotifications.tsx
//
// Fixed for real Android APK builds:
//  - Wraps handlers in useCallback so useMemo doesn't capture stale closures
//  - Registers for Expo push tokens (required for remote notifications)
//  - Removes unreliable Expo Go detection via navigator.userAgent
//  - Proper Android notification channel setup

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform } from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationContextValue = {
  /** Schedule a local notification. Returns the notification ID, or undefined on failure. */
  scheduleNotificationAsync: (
    request: Notifications.NotificationRequestInput,
  ) => Promise<string | undefined>;
  /** Cancel the most-recently scheduled notification. */
  cancelScheduledNotificationAsync: () => Promise<void>;
  /** The Expo push token for this device, or null if unavailable. */
  expoPushToken: string | null;
};

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationsContext = createContext<
  NotificationContextValue | undefined
>(undefined);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Ensure the Android "default" notification channel exists.
 * Safe to call multiple times — Android deduplicates by channel ID.
 */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF385C",
  });
}

/**
 * Request notification permissions and return whether they were granted.
 */
async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Fetch the Expo push token. Only works on a real physical device
 * with a valid projectId. Returns null in simulators/emulators.
 *
 * The projectId comes from app.json → extra.eas.projectId.
 */
async function fetchExpoPushToken(): Promise<string | null> {
  // Push tokens are only available on real devices
  if (!Device.isDevice) {
    console.log(
      "[Notifications] Push tokens unavailable in emulator/simulator",
    );
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "[Notifications] No projectId found in app.json → extra.eas.projectId. " +
        "Push notifications will not work.",
    );
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Notifications] Expo push token:", data);
    return data;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token:", e);
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scheduledNotificationIdRef = useRef<string>("");
  const pushTokenRef = useRef<string | null>(null);

  // ── Boot-time setup ──────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Set how notifications appear while the app is in the foreground.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // 2. Create the Android channel early (before any scheduling attempt).
    ensureAndroidChannel().catch((e) =>
      console.warn("[Notifications] Channel setup failed:", e),
    );

    // 3. Register for push notifications in the background.
    //    We don't await this — it shouldn't block the app.
    (async () => {
      try {
        await ensureAndroidChannel();
        const granted = await requestPermissions();
        if (!granted) {
          console.warn("[Notifications] Permission denied by user.");
          return;
        }
        pushTokenRef.current = await fetchExpoPushToken();
      } catch (e) {
        console.warn("[Notifications] Registration failed:", e);
      }
    })();

    // 4. Listen for notifications received while the app is open.
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Notifications] Received:", notification);
      },
    );

    // 5. Listen for the user tapping a notification.
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[Notifications] Response:", response);
        // TODO: navigate based on response.notification.request.content.data
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  // ── scheduleNotificationAsync ────────────────────────────────────────────
  const scheduleNotificationAsync = useCallback(
    async (
      request: Notifications.NotificationRequestInput,
    ): Promise<string | undefined> => {
      try {
        // Ensure channel exists (belt-and-suspenders for Android).
        await ensureAndroidChannel();

        const granted = await requestPermissions();
        if (!granted) {
          console.warn(
            "[Notifications] Cannot schedule — permission not granted.",
          );
          return undefined;
        }

        const id = await Notifications.scheduleNotificationAsync(request);
        scheduledNotificationIdRef.current = id;
        console.log("[Notifications] Scheduled notification id:", id);
        return id;
      } catch (e) {
        console.warn("[Notifications] Failed to schedule:", e);
        return undefined;
      }
    },
    [],
  );

  // ── cancelScheduledNotificationAsync ────────────────────────────────────
  const cancelScheduledNotificationAsync =
    useCallback(async (): Promise<void> => {
      const id = scheduledNotificationIdRef.current;
      if (!id) return;
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log("[Notifications] Cancelled notification id:", id);
      } catch (e) {
        console.warn("[Notifications] Failed to cancel:", e);
      } finally {
        scheduledNotificationIdRef.current = "";
      }
    }, []);

  // ── Context value ────────────────────────────────────────────────────────
  const value = useMemo<NotificationContextValue>(
    () => ({
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
      expoPushToken: pushTokenRef.current,
    }),
    // These are stable useCallback refs — safe to include.
    [scheduleNotificationAsync, cancelScheduledNotificationAsync],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be called from within NotificationsProvider",
    );
  }
  return ctx;
}
