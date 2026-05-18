import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { Colors, Spacing } from "../constants/theme";

const ICONS = {
  listings: {
    ios: "building.2",
    android: "storefront",
    web: "storefront",
  },
  booking: { ios: "calendar", android: "calendar_today", web: "calendar" },
  dashboard: { ios: "chart.bar", android: "bar_chart", web: "chart" },
  inbox: { ios: "message", android: "chat_bubble", web: "chat_bubble" },
  profile: {
    ios: "person.circle",
    android: "account_circle",
    web: "account_circle",
  },
} as const;

type IconName = (typeof ICONS)[keyof typeof ICONS];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  // expo-symbols typing is very strict; cast to the supported prop type.
  return <SymbolView name={name as any} tintColor={color} size={24} />;
}

export { ICONS };

export default function HostTabs() {
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
        name="listings"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name={ICONS.listings} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name={ICONS.booking} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name={ICONS.dashboard} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name={ICONS.inbox} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name={ICONS.profile} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
