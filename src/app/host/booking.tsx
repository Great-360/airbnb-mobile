import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function HostBookingScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.heading}>
          Host Booking
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Placeholder for host booking management.
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
