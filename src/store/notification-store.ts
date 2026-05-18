// src/store/notification-store.ts
//
// A lightweight in-session notification store.
// Every call to showToast() appends here, and the Inbox screen
// subscribes to re-render whenever a new notification arrives.

export type NotificationType = "success" | "error" | "info";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  date: string; // ISO timestamp
};

type Listener = () => void;

// Module-level singleton — survives navigation, cleared on app restart.
const _notifications: AppNotification[] = [];
const _listeners = new Set<Listener>();

function _emit() {
  _listeners.forEach((l) => l());
}

/** Append a new notification and notify all subscribers. */
export function addNotification(
  n: Omit<AppNotification, "id" | "date">,
): void {
  _notifications.unshift({
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
  });
  _emit();
}

/** Return a snapshot of all notifications (newest first). */
export function getNotifications(): AppNotification[] {
  return [..._notifications];
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

/** Clear all notifications (e.g. on logout). */
export function clearNotifications(): void {
  _notifications.length = 0;
  _emit();
}