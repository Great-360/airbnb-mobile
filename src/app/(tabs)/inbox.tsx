import { getUserBookings } from "@/api/bookings";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/store/auth-store";
import type { Booking } from "@/types/booking";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "messages" | "notifications";

type Notification = {
  id: string;
  type: "confirmed" | "cancelled" | "pending";
  title: string;
  body: string;
  date: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(end).toLocaleDateString(undefined, opts)}`;
}

function notificationsFromBookings(bookings: Booking[]): Notification[] {
  return bookings.map((b) => {
    const status = String(b.status ?? "").toUpperCase();
    const listingName = b.listing?.title ?? "your reservation";
    const dateRange = formatDateRange(b.startDate, b.endDate);
    const createdLabel = formatDate(b.createdAt);

    if (status === "CANCELLED") {
      return {
        id: b.id,
        type: "cancelled" as const,
        title: `Reservation canceled`,
        body: `${listingName}${dateRange ? ` · ${dateRange}` : ""}`,
        date: createdLabel,
      };
    }
    if (status === "PENDING") {
      return {
        id: b.id,
        type: "pending" as const,
        title: `Reservation request sent`,
        body: `${listingName}${dateRange ? ` · ${dateRange}` : ""}`,
        date: createdLabel,
      };
    }
    // CONFIRMED (default)
    return {
      id: b.id,
      type: "confirmed" as const,
      title: `Reservation confirmed`,
      body: `${listingName}${dateRange ? ` · ${dateRange}` : ""}`,
      date: createdLabel,
    };
  });
}

// ─── Notification icon ────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "cancelled") {
    return (
      <SymbolView
        name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
        size={32}
        tintColor="#717171"
      />
    );
  }
  if (type === "pending") {
    return (
      <SymbolView
        name={{
          ios: "clock.fill",
          android: "access_time",
          web: "access_time",
        }}
        size={32}
        tintColor={Colors.light.primary}
      />
    );
  }
  return (
    <SymbolView
      name={{ ios: "checkmark.seal.fill", android: "verified", web: "verified" }}
      size={32}
      tintColor="#008a05"
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InboxScreen() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>("messages");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch bookings → derive notifications
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setIsLoading(true);
        try {
          const token = await getToken();
          if (cancelled) return;

          if (!token) {
            setIsLoggedIn(false);
            setNotifications([]);
            setIsLoading(false);
            return;
          }

          setIsLoggedIn(true);
          const bookings = await getUserBookings();
          if (cancelled) return;
          setNotifications(notificationsFromBookings(bookings));
        } catch {
          if (cancelled) return;
          setNotifications([]);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // ── Tab bar ────────────────────────────────────────────────────────────────

  function TabButton({
    tab,
    label,
    badge,
  }: {
    tab: TabKey;
    label: string;
    badge?: number;
  }) {
    const active = activeTab === tab;
    return (
      <Pressable style={styles.tabBtn} onPress={() => setActiveTab(tab)}>
        <View style={styles.tabLabelRow}>
          <ThemedText
            style={[
              styles.tabLabel,
              {
                color: active ? theme.text : theme.textSecondary,
                fontWeight: active ? "600" : "400",
              },
            ]}
          >
            {label}
          </ThemedText>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{badge}</ThemedText>
            </View>
          )}
        </View>
        {active && (
          <View style={[styles.tabUnderline, { backgroundColor: theme.text }]} />
        )}
      </Pressable>
    );
  }

  // ── Messages tab content ───────────────────────────────────────────────────

  function MessagesContent() {
    // This app models booking confirmation as Inbox “messages”.
    // Pending bookings represent confirmation requests.
    const pending = notifications.filter((n) => n.type === "pending");

    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      );
    }

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyState}>
          <SymbolView
            name={{ ios: "message", android: "chat_bubble", web: "chat_bubble" }}
            size={48}
            tintColor={theme.textSecondary}
          />
          <ThemedText style={styles.emptyTitle}>Log in to view requests</ThemedText>
          <ThemedText
            style={[styles.emptyBody, { color: theme.textSecondary }]}
          >
            Booking requests awaiting confirmation will appear here.
          </ThemedText>
        </View>
      );
    }

    if (pending.length === 0) {
      return (
        <View style={styles.emptyState}>
          <SymbolView
            name={{ ios: "message", android: "chat_bubble", web: "chat_bubble" }}
            size={48}
            tintColor={theme.textSecondary}
          />
          <ThemedText style={styles.emptyTitle}>No requests yet</ThemedText>
          <ThemedText
            style={[styles.emptyBody, { color: theme.textSecondary }]}
          >
            When you send a booking request, it will show up here.
          </ThemedText>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.five }}
      >
        {pending.map((notif, index) => (
          <View key={notif.id}>
            <View style={styles.notifRow}>
              <View style={styles.notifIcon}>
                <NotifIcon type="pending" />
              </View>
              <View style={styles.notifContent}>
                <ThemedText style={styles.notifTitle}>Pending confirmation</ThemedText>
                <ThemedText
                  style={[styles.notifBody, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {notif.body}
                </ThemedText>
                {notif.date ? (
                  <ThemedText
                    style={[styles.notifDate, { color: theme.textSecondary }]}
                  >
                    {notif.date}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            {index < pending.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </ScrollView>
    );
  }


  // ── Notifications tab content ──────────────────────────────────────────────

  function NotificationsContent() {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      );
    }

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyState}>
          <SymbolView
            name={{ ios: "bell", android: "notifications", web: "notifications" }}
            size={48}
            tintColor={theme.textSecondary}
          />
          <ThemedText style={styles.emptyTitle}>Log in to see notifications</ThemedText>
          <ThemedText
            style={[styles.emptyBody, { color: theme.textSecondary }]}
          >
            Booking updates and reservation alerts will appear here.
          </ThemedText>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.caughtUp}>
          <ThemedText style={[styles.caughtUpText, { color: theme.textSecondary }]}>
            You are all caught up
          </ThemedText>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.five }}
      >
        {notifications.map((notif, index) => (
          <View key={notif.id}>
            <Pressable
              style={({ pressed }) => [
                styles.notifRow,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.notifIcon}>
                <NotifIcon type={notif.type} />
              </View>
              <View style={styles.notifContent}>
                <ThemedText style={styles.notifTitle}>{notif.title}</ThemedText>
                <ThemedText
                  style={[styles.notifBody, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {notif.body}
                </ThemedText>
                {notif.date ? (
                  <ThemedText
                    style={[styles.notifDate, { color: theme.textSecondary }]}
                  >
                    {notif.date}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
            {index < notifications.length - 1 && (
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
        edges={["top", "left", "right"]}
      >
        {/* Heading */}
        <ThemedText type="subtitle" style={styles.heading}>
          Inbox
        </ThemedText>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TabButton tab="messages" label="Messages" />
          <TabButton
            tab="notifications"
            label="Notifications"
            badge={isLoggedIn ? notifications.length : undefined}
          />
        </View>
        <View style={[styles.tabDivider, { backgroundColor: theme.border }]} />

        {/* Tab content */}
        <View style={{ flex: 1 }}>
          {activeTab === "messages" ? (
            <MessagesContent />
          ) : (
            <NotificationsContent />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    gap: Spacing.four,
  },
  tabBtn: {
    paddingBottom: Spacing.two,
    position: "relative",
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  tabLabel: {
    fontSize: 16,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.three,
  },

  // Badge
  badge: {
    backgroundColor: "#222",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Empty / caught-up states
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
  },
  caughtUp: {
    paddingTop: Spacing.four,
  },
  caughtUpText: {
    fontSize: 15,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Notification rows
  notifRow: {
    flexDirection: "row",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "flex-start",
  },
  notifIcon: {
    width: 44,
    alignItems: "center",
    paddingTop: 2,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  notifBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  notifDate: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});