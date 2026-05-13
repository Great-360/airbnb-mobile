import { StyleSheet } from "react-native"
import { SymbolView } from "expo-symbols";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";


export default function TripsScreen() {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={[styles.safeArea,  {paddingBottom: BottomTabInset}]}>
                
                <ThemedText type="subtitle" style={styles.heading}>Trips</ThemedText>

                <ThemedView style={styles.emptyState}>
                    <SymbolView name={{ ios: 'airplane', android: 'flight', web: 'flight' }} size={48} tintColor={Colors.light.primary} />

                    <ThemedText type="default" style={styles.emptyTitle}>No Trips booked Yet</ThemedText>

                    <ThemedText themeColor="textSecondary" style={styles.emptyBody}>Time to dust off your bags and start plannining your next adventure.</ThemedText>
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
