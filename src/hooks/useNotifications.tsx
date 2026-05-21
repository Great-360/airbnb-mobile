import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform } from "react-native";

type NotificationContextValue = {
  scheduleNotificationAsync: (
    request: Notifications.NotificationRequestInput,
  ) => Promise<string | undefined>;
  cancelScheduledNotificationAsync: () => Promise<void>;
};

const NotificationsContext = createContext<
  NotificationContextValue | undefined
>(undefined);

function shouldKeepExpoGoNoop() {
  // Expo Go does not support remote notifications on Android (SDK 53+).
  // Local notifications still work, but the safest behavior for this app
  // is to keep scheduling disabled in Expo Go.
  //
  // We try to detect Expo Go at runtime; if we can't, we fall back to enabled.
  const expoGo =
    typeof navigator !== "undefined" &&
    // Some environments expose something like "Expo Go".
    String(navigator.userAgent || "")
      .toLowerCase()
      .includes("exponent") &&
    String(navigator.userAgent || "")
      .toLowerCase()
      .includes("go");
  // On native, this heuristic won't work; enable by default.
  return expoGo;
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scheduledNotificationIdRef = useRef<string>("");

  useEffect(() => {
    // Configure foreground notification behavior.
    // This is safe in both dev and release builds.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  const scheduleNotificationAsync = async (
    request: Notifications.NotificationRequestInput,
  ): Promise<string | undefined> => {
    if (shouldKeepExpoGoNoop()) {
      console.warn("Notifications scheduling is disabled in Expo Go.", request);
      return undefined;
    }

    try {
      // Android 13+ requires permission prompt. Also create a channel before token/permission flows.
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const permissions = await Notifications.getPermissionsAsync();
      let finalStatus = permissions.granted;
      if (!finalStatus) {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.granted;
      }

      if (!finalStatus) {
        console.warn("Notification permissions not granted");
        return undefined;
      }

      const id = await Notifications.scheduleNotificationAsync(request);
      scheduledNotificationIdRef.current = id;
      return id;
    } catch (e) {
      console.warn("Failed to schedule notification", e);
      return undefined;
    }
  };

  const cancelScheduledNotificationAsync = async () => {
    if (shouldKeepExpoGoNoop()) {
      scheduledNotificationIdRef.current = "";
      return;
    }

    try {
      if (scheduledNotificationIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(
          scheduledNotificationIdRef.current,
        );
      }
    } finally {
      scheduledNotificationIdRef.current = "";
    }
  };

  const value = useMemo<NotificationContextValue>(
    () => ({
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
    }),
    [],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be called from within NotificationsProvider",
    );
  }
  return ctx;
}
