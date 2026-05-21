// src/utils/toast.ts
//
// Drop-in replacement for Toast.show that also records the message
// in the notification store so it appears in the Inbox > Notifications tab.
//
// Usage:  import { showToast } from "@/utils/toast";
//         showToast({ type: "success", text1: "Added to wishlist" });

import {
  addNotification,
  type NotificationType,
} from "@/store/notification-store";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";

type ToastParams = Parameters<typeof Toast.show>[0];

export function showToast(params: ToastParams): void {
  // Record into local store so it shows up in Inbox > Notifications.
  // (Toast UI intentionally disabled to replace toasts with notifications.)
  // Toast.show(params);

  // Map toast type → notification type
  const typeMap: Record<string, NotificationType> = {
    success: "success",
    error: "error",
    info: "info",
  };
  const type: NotificationType = typeMap[params.type ?? "info"] ?? "info";

  const title = params.text1 ?? "";
  const body =
    typeof params.text2 === "string" && params.text2.trim()
      ? params.text2.trim()
      : undefined;

  // Only record if there's something meaningful to show
  if (title.trim()) {
    addNotification({ type, title, body });

    // Trigger immediate local system notification
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: params && typeof params === "object" ? params : undefined,
      },
      trigger: null,
    }).catch((e) => {
      console.warn("[Notifications] Failed to schedule toast notification:", e);
    });
  }
}

