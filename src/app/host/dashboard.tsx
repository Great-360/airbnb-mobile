import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function HostDashboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.heading}>
          Host Dashboard
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Placeholder for host analytics and overview.
        </ThemedText>
        <View style={{ height: Spacing.five }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  heading: {
    marginBottom: Spacing.two,
  },
});
