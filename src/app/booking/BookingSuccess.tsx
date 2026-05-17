import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function BookingSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    listingId?: string;
  }>();

  const listingId = String(params.listingId ?? "");

  return (
    <ThemedView style={styles.container}>
      <View style={styles.center}>
        <ThemedText type="subtitle" style={styles.title}>
          Booking confirmed 🎉
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          Your trip is all set. You can view it anytime in Trips.
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: Colors.light.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => {
            if (listingId) router.replace(`/listing/${listingId}` as any);
            else router.replace("/(tabs)/trips");
          }}
        >
          <ThemedText style={styles.primaryBtnText}>View trip</ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.replace("/(tabs)/trips")}
        >
          <ThemedText style={[styles.secondaryText, { color: theme.text }]}>
            Go to Trips
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four },
  center: { flex: 1, justifyContent: "center", gap: Spacing.three },
  title: { fontWeight: "800", fontSize: 20 },
  body: { fontSize: 14, lineHeight: 22, marginBottom: Spacing.two },

  primaryBtn: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryText: { fontWeight: "700", fontSize: 15 },
});
