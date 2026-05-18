import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function HostInboxScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.heading}>
          Host Inbox
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Placeholder for host messages.
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
