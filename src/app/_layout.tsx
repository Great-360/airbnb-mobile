import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import Toast from "react-native-toast-message";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="host" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
      </Stack>

      <Toast />
    </ThemeProvider>
  );
}
