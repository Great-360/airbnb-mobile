import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import { useNotifications } from "@/hooks/useNotifications";
import { authHeaders, clearToken, getToken } from "@/store/auth-store";
import * as Notifications from "expo-notifications";

type Role = "HOST" | "GUEST";

type User = {
  role?: Role | string | null;
};

function normalizeRole(role: unknown): Role | null {
  const raw = String(role ?? "")
    .trim()
    .toUpperCase();
  if (!raw) return null;
  if (raw === "HOST") return "HOST";
  if (raw === "GUEST") return "GUEST";
  // backend might send other variants; keep it strict-ish but tolerant
  if (raw.includes("HOST")) return "HOST";
  if (raw.includes("GUEST")) return "GUEST";
  return null;
}

export default function IndexScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { scheduleNotificationAsync, cancelScheduledNotificationAsync } =
    useNotifications();

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        setIsLoading(true);

        const token = await getToken();
        if (!token) {
          router.replace("/(tabs)/explore");
          return;
        }

        const headers = await authHeaders();

        // /auth/me can fail intermittently on cold start. Retry once before clearing token.
        let res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 250));
          res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
        }

        if (!res.ok) {
          // token likely invalid/expired now
          await clearToken();
          router.replace("/(tabs)/explore");
          return;
        }

        const json = (await res.json()) as User;
        const role = normalizeRole(json.role);

        if (role === "HOST") {
          router.replace("/host/listings");
        } else {
          router.replace("/(tabs)/explore");
        }
      } catch {
        // don't hard-clear token on unknown network errors
        router.replace("/(tabs)/explore");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    decide();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const sendTestNotification = async () => {
    await scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification!",
        body: "This is a test.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText type="subtitle" style={styles.text}>
            Loading…
          </ThemedText>
        </>
      ) : (
        <ThemedText type="subtitle">Redirecting…</ThemedText>
      )}

      <View style={styles.notificationPanel}>
        <ThemedText type="subtitle" style={styles.panelTitle}>
          Notification test
        </ThemedText>
        <ThemedText type="default" style={styles.panelSubtitle}>
          Tap to schedule a local notification in 2 seconds.
        </ThemedText>

        <View style={styles.buttonsRow}>
          <ThemedText
            onPress={sendTestNotification}
            style={styles.button}
            type="smallBold"
          >
            Send
          </ThemedText>

          <ThemedText
            onPress={cancelScheduledNotificationAsync}
            style={[styles.button, { backgroundColor: "#333" }]}
            type="smallBold"
          >
            Cancel
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  text: { marginTop: Spacing.two },
  notificationPanel: {
    width: "100%",
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    gap: Spacing.two,
  },
  panelTitle: { fontSize: 16 },
  panelSubtitle: { fontSize: 12, textAlign: "center", color: "#666" },
  buttonsRow: { flexDirection: "row", gap: Spacing.three },
  button: {
    backgroundColor: Colors.light.primary,
    color: "#fff",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    overflow: "hidden",
    fontWeight: "600",
  },
});
