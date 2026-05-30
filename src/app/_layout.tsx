import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { useColorScheme, Platform } from "react-native";
import Toast from "react-native-toast-message";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { NotificationsProvider } from "@/hooks/useNotifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: "always",
            retry: 2,
            retryDelay: (attemptIndex) => {
              // exponential backoff: 1s, 2s, 4s...
              const delay = 1000 * 2 ** attemptIndex;
              return delay;
            },
          },
        },
      }),
  );

  useReactQueryDevTools(queryClient);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
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

          {Platform.OS === "web" && ReactQueryDevtools ? (
            <ReactQueryDevtools initialIsOpen={false} />
          ) : null}
        </NotificationsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
