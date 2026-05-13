import { SymbolView } from "expo-symbols";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";

export default function WishListScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { paddingBottom: BottomTabInset}]}>
        <ThemedText type="subtitle" style={styles.heading}>Wishlists</ThemedText>
        <ThemedView style={styles.emptyState}>
          <SymbolView
            name={{ ios: "heart", android: "favorite", web: "favorite" }}
            size={48}
            tintColor={Colors.light.primary}
          />
          <ThemedText style={styles.emptyTitle} type="default">
            Create Your first wishlist
          </ThemedText>
          <ThemedText style={styles.emptyBody} themeColor="textSecondary">
            Save your favorite items to easily find them later.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
});

