import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ListingCard, Listing } from "@/components/listing-card";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authHeaders } from "@/store/auth-store";

const API_BASE_URL = "https://airbnb-api-1-25gk.onrender.com/api/v1";

export default function WishlistScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      if (!("Authorization" in headers)) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
      const res = await fetch(`${API_BASE_URL}/wishlists`, { headers });
      if (!res.ok) return;
      const data: Listing[] = await res.json();
      setListings(data);
      setWishlistedIds(new Set(data.map((l) => l.id)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  async function handleRemove(listing: Listing) {
    // Optimistic remove
    setListings((prev) => prev.filter((l) => l.id !== listing.id));
    setWishlistedIds((prev) => {
      const n = new Set(prev);
      n.delete(listing.id);
      return n;
    });

    Toast.show({
      type: "info",
      text1: "Removed from wishlist",
      position: "bottom",
    });

    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/wishlists/${listing.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        // Roll back if delete failed
        setListings((prev) => [listing, ...prev]);
        setWishlistedIds((prev) => new Set([...prev, listing.id]));
        Toast.show({
          type: "error",
          text1: "Failed to remove from wishlist",
          position: "bottom",
        });
      }
    } catch {
      setListings((prev) => [listing, ...prev]);
      setWishlistedIds((prev) => new Set([...prev, listing.id]));
      Toast.show({
        type: "error",
        text1: "Network error. Try again.",
        position: "bottom",
      });
    }
  }

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
            Wishlists
          </ThemedText>
          <View style={styles.centered}>
            <SymbolView
              name={{ ios: "heart", android: "favorite", web: "favorite" }}
              size={48}
              tintColor={Colors.light.primary}
            />
            <ThemedText style={styles.emptyTitle}>
              Log in to see your wishlists
            </ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            > 
              Save your favourite listings and find them here any time.
            </ThemedText>
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
          <ListingCard
            listing={item}
            onPress={(l) => console.log("Open listing", l.id)}
            onWishlistPress={handleRemove}
            isWishlisted={wishlistedIds.has(item.id)}
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
              Wishlists
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
            <ThemedText style={styles.emptyTitle}>
              No saved listings yet
            </ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            >
              Tap the heart on any listing to save it here.
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
});
