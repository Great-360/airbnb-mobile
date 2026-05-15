import { SymbolView } from "expo-symbols";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";

export default function  InboxScreen() {

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={[styles.safeArea,  {paddingBottom: BottomTabInset}]}>


                <ThemedText type="subtitle" style={styles.heading}>Inbox</ThemedText>

                <ThemedView style={styles.emptyState}>
                    <SymbolView name={{ ios: 'envelope', android: 'email', web: 'email' }} size={48} tintColor={Colors.light.primary} />

                    <ThemedText type="default" style={styles.emptyTitle}>No Messages Yet</ThemedText>

                    <ThemedText themeColor="textSecondary" style={styles.emptyBody}>Your messages will appear here. Start a conversation to see it in action.</ThemedText>
                </ThemedView>
            </SafeAreaView>

        </ThemedView>
    )
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
 
