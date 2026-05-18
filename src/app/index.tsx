import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import { authHeaders, clearToken, getToken } from "@/store/auth-store";

type Role = "HOST" | "GUEST";

type User = {
  role?: Role | string | null;
};

export default function IndexScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
        if (!res.ok) {
          await clearToken();
          router.replace("/(tabs)/explore");
          return;
        }

        const json = (await res.json()) as User;
        const role = String(json.role ?? "").toUpperCase();

        if (role === "HOST") {
          router.replace("/host/listings");
        } else {
          router.replace("/(tabs)/explore");
        }
      } catch {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
  },
  text: { marginTop: Spacing.two },
});
