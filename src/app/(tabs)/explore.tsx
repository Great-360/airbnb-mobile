// src/app/explore.tsx  — updated to sync wishlist hearts with the API

import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ListingCard } from "@/components/listing-card";
import { API_BASE_URL } from "@/constants/api";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Listing } from "@/types/listing";
import { authHeaders } from "@/store/auth-store";
import { toggleWishlist } from "@/utils/wishlist-toggle";
import { useRouter } from "expo-router";

const CATEGORIES = [
  {
    id: "all",
    label: "OMG!",
    icon: { ios: "eye", android: "visibility", web: "visibility" },
    type: null,
  },
  {
    id: "villa",
    label: "Beach",
    icon: { ios: "sun.max", android: "wb_sunny", web: "wb_sunny" },
    type: "VILLA",
  },
  {
    id: "apartment",
    label: "Amazing pools",
    icon: { ios: "drop.fill", android: "pool", web: "pool" },
    type: "APARTMENT",
  },
  {
    id: "cabin",
    label: "Cabins",
    icon: { ios: "house", android: "home", web: "home" },
    type: "CABIN",
  },
  {
    id: "house",
    label: "Houses",
    icon: { ios: "building.2", android: "location_city", web: "location_city" },
    type: "HOUSE",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");

  // ── Fetch listings ──────────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      if (category?.type) params.append("type", category.type);

      const res = await fetch(`${API_BASE_URL}/listings/search?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setListings(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // ── Fetch wishlist IDs ──────────────────────────────────────────────────────
  // Called once on mount. Uses /wishlists/ids (lightweight — just IDs)
  // so the hearts render correctly without loading full listing objects.
  const fetchWishlistIds = useCallback(async () => {
    try {
      const headers = await authHeaders();
      // If the user isn't logged in, authHeaders() returns {} and we get a 401
      // We just swallow it — unauthenticated users see unfilled hearts
      const res = await fetch(`${API_BASE_URL}/wishlists/ids`, { headers });
      if (!res.ok) return; // not logged in — no hearts filled
      const json = await res.json();
      setWishlistedIds(new Set(json.ids as string[]));
    } catch {
      // network issue — silently ignore, hearts default to unfilled
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);
  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // ── Toggle wishlist ─────────────────────────────────────────────────────────
  // 1. Optimistically update UI (instant feedback)
  // 2. Call the API in the background
  // 3. Roll back if the API call fails
  async function handleWishlistToggle(listing: Listing) {
    const wasSaved = wishlistedIds.has(listing.id);

    setWishlistedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(listing.id) : next.add(listing.id);
      return next;
    });

    const result = await toggleWishlist({ listing, wasSaved, router });

    if (!result.ok) {
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(listing.id) : next.delete(listing.id);
        return next;
      });
      if (result.reason === "unauthenticated") return;
      Toast.show({
        type: "error",
        text1:
          result.reason === "network_error"
            ? "Network error. Try again."
            : "Failed to update wishlist",
        position: "bottom",
      });
      return;
    }

    Toast.show({
      type: wasSaved ? "info" : "success",
      text1: wasSaved ? "Removed from wishlist" : "Added to wishlist",
      position: "bottom",
    });
  }

  // ── Header (search bar + category tabs) ────────────────────────────────────
  function renderHeader() {
    return (
      <ThemedView>
        <View
          style={[styles.searchWrap, { paddingTop: insets.top + Spacing.two }]}
        >
          <Pressable
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              size={16}
              tintColor={theme.text}
            />
            <View style={styles.searchText}>
              <ThemedText style={styles.searchPrimary}>Where to?</ThemedText>
              <ThemedText
                style={[styles.searchSecondary, { color: theme.textSecondary }]}
              >
                Anywhere · Any week · Add guests
              </ThemedText>
            </View>
            <View style={[styles.filterBtn, { borderColor: theme.border }]}>
              <SymbolView
                name={{
                  ios: "slider.horizontal.3",
                  android: "tune",
                  web: "tune",
                }}
                size={14}
                tintColor={theme.text}
              />
            </View>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {CATEGORIES.map((cat) => {
            const active = cat.id === selectedCategory;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={styles.tab}
              >
                <SymbolView
                  name={cat.icon}
                  size={22}
                  tintColor={active ? theme.text : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? theme.text : theme.textSecondary,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {cat.label}
                </ThemedText>
                {active && (
                  <View
                    style={[
                      styles.tabUnderline,
                      { backgroundColor: theme.text },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.emptyIcon}>⚠️</ThemedText>
        <ThemedText style={styles.emptyTitle}>
          Couldn't load listings
        </ThemedText>
        <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
          {error}
        </ThemedText>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: Colors.light.primary }]}
          onPress={fetchListings}
        >
          <ThemedText style={styles.retryText}>Try again</ThemedText>
        </Pressable>
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
            onPress={(l) => router.push(`/listing/${l.id}`)}
            onWishlistPress={handleWishlistToggle}
            isWishlisted={wishlistedIds.has(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.centered}>
              <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
              <ThemedText style={styles.emptyTitle}>
                No listings found
              </ThemedText>
            </View>
          )
        }
        contentContainerStyle={{
          paddingBottom: BottomTabInset + Spacing.four,
          flexGrow: 1,
        }}
        refreshing={isLoading}
        onRefresh={fetchListings}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {isLoading && listings.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      )}

      <View
        style={[styles.mapBtnWrap, { bottom: BottomTabInset + Spacing.three }]}
      >
        <Pressable style={styles.mapBtn}>
          <ThemedText style={styles.mapBtnText}>Map</ThemedText>
          <SymbolView
            name={{ ios: "map", android: "map", web: "map" }}
            size={14}
            tintColor="#fff"
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 40,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchText: { flex: 1, gap: 1 },
  searchPrimary: { fontWeight: "600", fontSize: 14 },
  searchSecondary: { fontSize: 12 },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContent: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  tab: {
    alignItems: "center",
    paddingBottom: Spacing.two,
    minWidth: 56,
    position: "relative",
  },
  tabLabel: { fontSize: 12, marginTop: 4 },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.five,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: "600", fontSize: 18, textAlign: "center" },
  emptyBody: { textAlign: "center", fontSize: 14 },
  retryBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  mapBtnWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: "#222",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  mapBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
