import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useTheme } from "@/hooks/use-theme";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";

const MENU_ITEMS = [
  {
    icon: { ios: "person", android: "person", web: "person" },
    label: "Personal Info",
  },
  {
    icon: { iso: "lock.shield", android: "security", web: "security" },
    label: "Login & Security",
  },
  {
    icon: { ios: "creditcard", android: "credit_card", web: "credit_card" },
    label: "Payment & payouts",
  },
  {
    icon: { ios: "bell", android: "notifications", web: "notifications" },
    label: "Notifications",
  },
  {
    icon: { ios: "questionmark.circle", android: "help", web: "help" },
    label: "Get help",
  },
] as const;

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
      >
        <ThemedText type="subtitle" style={styles.heading}>
          Profile
        </ThemedText>

        {/* Avatar Card */}
        <ThemedView type="backgroundElement" style={styles.avatarCard}>
          <ThemedView
            style={[
              styles.avatarCircle,
              { backgroundColor: Colors.light.primary },
            ]}
          >
            <ThemedText style={styles.avatarInitial}>A</ThemedText>
          </ThemedView>

          <ThemedView style={styles.avatarInfo}>
            <ThemedText type="default" style={{ fontWeight: "600" }}>
              Alex Johnson
            </ThemedText>
            <ThemedText themeColor="textSecondary">Show Profile</ThemedText>
          </ThemedView>
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={14}
            tintColor={theme.textSecondary}
          />
        </ThemedView>
        {/* Settings Menu */}
        <ThemedView type="backgroundElement" style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={index}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.pressed,
                ]}
                onPress={() => console.log(`Pressed ${item.label}`)}
              >
                <SymbolView name={item.icon} size={18} tintColor={theme.text} />

                <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                <SymbolView
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={12}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
              {index < MENU_ITEMS.length - 1 && (
                <ThemedView
                  style={[
                    styles.divider,
                    { backgroundColor: theme.backgroundSelected },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
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

  // ── Avatar card
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  avatarInfo: {
    flex: 1,
    gap: 2,
  },

  // ── Settings menu
  menuCard: {
    borderRadius: Spacing.three,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + 18 + Spacing.three, // align under the label
  },
  pressed: {
    opacity: 0.6,
  },
});
