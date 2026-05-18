import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WishlistRowCard } from "@/components/wishlist-row-card";
import { API_BASE_URL } from "@/constants/api";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authHeaders } from "@/store/auth-store";
import type { Listing } from "@/types/listing";

export default function WishlistScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      if (!("Authorization" in headers)) {
        setIsLoggedIn(false);
        setListings([]);
        return;
      }
      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/wishlists`, { headers });
      if (!res.ok) return;
      const data: Listing[] = await res.json();
      setListings(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist]),
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </ThemedView>
    );
  }

  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          <ThemedText type="subtitle" style={styles.heading}>
            Wishlist
          </ThemedText>
          <View style={styles.centered}>
            <SymbolView
              name={{ ios: "heart", android: "favorite", web: "favorite" }}
              size={48}
              tintColor={Colors.light.primary}
            />
            <ThemedText style={styles.emptyTitle}>
              Log in to see your wishlist
            </ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            >
              Save your favourite listings and find them here any time.
            </ThemedText>
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push("/profile")}
            >
              <ThemedText style={styles.loginButtonText}>Log in</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WishlistRowCard
            listing={item}
            onPress={(l) => router.push(`/listing/${l.id}`)}
          />
        )}
        ListHeaderComponent={
          <View
            style={[
              styles.safeArea,
              { paddingTop: insets.top, paddingBottom: 0 },
            ]}
          >
            <ThemedText type="subtitle" style={styles.heading}>
              Wishlist
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <SymbolView
              name={{ ios: "heart", android: "favorite", web: "favorite" }}
              size={48}
              tintColor={Colors.light.primary}
            />
            <ThemedText style={styles.emptyTitle}>Nothing saved yet</ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            >
              Tap the heart on any listing to add it here.
            </ThemedText>
          </View>
        }
        contentContainerStyle={{
          paddingBottom: BottomTabInset + Spacing.four,
          flexGrow: 1,
        }}
        refreshing={isLoading}
        onRefresh={fetchWishlist}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { paddingHorizontal: Spacing.four },
  heading: { marginTop: Spacing.five, marginBottom: Spacing.four },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.five,
  },
  emptyTitle: { fontWeight: "600", fontSize: 18, textAlign: "center" },
  emptyBody: { textAlign: "center", lineHeight: 22, fontSize: 14 },
  loginButton: {
    marginTop: Spacing.two,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
