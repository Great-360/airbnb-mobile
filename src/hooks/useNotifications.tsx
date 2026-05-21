import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

type NotificationContextValue = {
  // Keep same external API, but implement as no-op if Expo Go blocks remote notifications.
  scheduleNotificationAsync: (request: unknown) => Promise<string | undefined>;
  cancelScheduledNotificationAsync: () => Promise<void>;
};

const NotificationsContext = createContext<
  NotificationContextValue | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scheduledNotificationIdRef = useRef<string>("");

  // Expo Go (SDK 53) blocks remote notifications. Also, scheduling remote notifications
  // is not reliable without a development build.
  // We intentionally keep this provider as a safe no-op in Expo Go.
  useEffect(() => {
    // no-op
  }, []);

  const scheduleNotificationAsync = async (
    request: unknown,
  ): Promise<string | undefined> => {
    console.warn(
      "Notifications scheduling is disabled in this build. Use a development build for Expo notifications.",
      request,
    );
    return undefined;
  };

  const cancelScheduledNotificationAsync = async () => {
    // no-op
    scheduledNotificationIdRef.current = "";
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
