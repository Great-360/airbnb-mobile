// src/hooks/useNotifications.tsx
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

type NotificationContextValue = {
  scheduleNotificationAsync: (
    request: Notifications.NotificationRequestInput,
  ) => Promise<string | undefined>;
  cancelScheduledNotificationAsync: () => Promise<void>;
  expoPushToken: string | null;
  permissionStatus: string;
};

const NotificationsContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF385C",
  });
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const scheduledIdRef = useRef<string>("");
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("unknown");

  useEffect(() => {
    // 1. Foreground display config
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowAlert: true,   // works on all SDK versions
        shouldShowBanner: true,  // SDK 53+
        shouldShowList: true,
      }),
    });

    // 2. Android channel
    ensureAndroidChannel().catch(console.warn);

    // 3. Request permission + get push token
    (async () => {
      try {
        await ensureAndroidChannel();

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        setPermissionStatus(finalStatus);

        if (finalStatus !== "granted") {
          console.warn("[Notifications] Permission not granted:", finalStatus);
          return;
        }

        // Push token (only on real devices)
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        if (projectId) {
          try {
            const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
            console.log("[Notifications] Push token:", data);
            setExpoPushToken(data);
          } catch (e) {
            // Emulator — expected to fail
            console.log("[Notifications] Push token unavailable (emulator?):", e);
          }
        }
      } catch (e) {
        console.warn("[Notifications] Setup error:", e);
      }
    })();

    const sub1 = Notifications.addNotificationReceivedListener((n) =>
      console.log("[Notifications] Received:", n.request.content.title),
    );
    const sub2 = Notifications.addNotificationResponseReceivedListener((r) =>
      console.log("[Notifications] Tapped:", r.notification.request.content.title),
    );

    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  const scheduleNotificationAsync = useCallback(
    async (request: Notifications.NotificationRequestInput): Promise<string | undefined> => {
      try {
        await ensureAndroidChannel();

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== "granted") {
            console.warn("[Notifications] Permission denied, cannot schedule.");
            return undefined;
          }
        }

        const id = await Notifications.scheduleNotificationAsync(request);
        scheduledIdRef.current = id;
        console.log("[Notifications] Scheduled id:", id);
        return id;
      } catch (e) {
        console.warn("[Notifications] Schedule error:", e);
        return undefined;
      }
    },
    [],
  );

  const cancelScheduledNotificationAsync = useCallback(async () => {
    const id = scheduledIdRef.current;
    if (!id) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn("[Notifications] Cancel error:", e);
    } finally {
      scheduledIdRef.current = "";
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
      expoPushToken,
      permissionStatus,
    }),
    [scheduleNotificationAsync, cancelScheduledNotificationAsync, expoPushToken, permissionStatus],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationsProvider");
  return ctx;
}