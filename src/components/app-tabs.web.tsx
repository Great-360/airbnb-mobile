import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { Colors, MaxContentWidth, Spacing } from "../constants/theme";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const TABS = [
  { name: "explore", href: "/explore", label: "Explore", icon: "search" },
  { name: "wishlist", href: "/wishlist", label: "Wishlist", icon: "favorite" },
  { name: "trips", href: "/trips", label: "Trips", icon: "flight" },
  { name: "inbox", href: "/inbox", label: "Inbox", icon: "chat_bubble" },
  {
    name: "profile",
    href: "/profile",
    label: "Profile",
    icon: "account_circle",
  },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />

      <TabList asChild>
        <NavBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <NavButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </NavBar>
      </TabList>
    </Tabs>
  );
}

type NavButtonProps = TabTriggerSlotProps & {
  icon: (typeof TABS)[number]["icon"];
  label: string;
};
function NavButton({ isFocused, icon, label, ...props }: NavButtonProps) {
  const colorScheme = useColorScheme();

  const colors = Colors[colorScheme == "dark" ? "dark" : "light"];

  const activeColor = colors.primary;
  const inactiveColor = colors.textSecondary;
  const iconColor = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
    >
      <SymbolView
        name={{ ios: icon, android: icon, web: icon } as any}
        tintColor={iconColor}
        size={22}
      />
      <ThemedText
        style={[
          styles.navLabel,
          { color: iconColor, fontWeight: isFocused ? "600" : "500" },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function NavBar(props: TabListProps) {
  const colorScheme = useColorScheme();

  const colors = Colors[colorScheme == "dark" ? "dark" : "light"];

  return (
    <View
      {...props}
      style={[styles.navBarOuter, { borderTopColor: colors.border }]}
    >
      <ThemedView type="background" style={styles.navBarInner}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    flex: 1,
    minHeight: 0,
    marginBottom: 90,
  },

  navBarOuter: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    justifyContent: "center",
    alignItems: "center",
  } as any,

  navBarInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingVertical: Spacing.two,
    backgroundColor: "transparent",
  },

  navButton: {
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  navLabel: {
    fontSize: 10,
  },
  pressed: {
    opacity: 0.6,
  },
});
