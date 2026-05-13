import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { Colors, Spacing } from "../constants/theme";

const ICONS = {
  explore: { ios: "magnifyingglass", android: "search", web: "search" },
  wishlist: { ios: "heart", android: "favorite", web: "favorite" },
  trips: { ios: "airplane", android: "flight", web: "flight" },
  inbox: { ios: "message", android: "chat_bubble", web: "chat_bubble" },
  profile: {
    ios: "person.circle",
    android: "account_circle",
    web: "account_circle",
  },
} as const;

type IconName = (typeof ICONS)[keyof typeof ICONS];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <SymbolView name={name} tintColor={color} size={24} />;
}

export { ICONS };

export default function AppTabs() {
  const colorScheme = useColorScheme();

  const colors = Colors[colorScheme == "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.select({ ios: 70, android: 120 }),
          paddingBottom: Platform.select({ ios: 20, android: 12 }),
          paddingTop: Spacing.two,
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name={ICONS.explore} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name={ICONS.wishlist} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name={ICONS.trips} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name={ICONS.inbox} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name={ICONS.profile} color={color} />,
        }}
      />
    </Tabs>
  );
}
