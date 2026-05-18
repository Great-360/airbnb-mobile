import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authHeaders } from "@/store/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingPhoto = { id: string; url: string };

type HostListing = {
  id: string;
  title: string;
  location: string;
  type: string;
  pricePerNight: number;
  guests: number;
  rating: number | null;
  reviewCount?: number;
  photos: ListingPhoto[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function HostListingCard({
  item,
  onPress,
}: {
  item: HostListing;
  onPress: () => void;
}) {
  const theme = useTheme();
  const imageUri = item.photos?.[0]?.url ?? PLACEHOLDER;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.border, opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={onPress}
    >
      <Image source={{ uri: imageUri }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.cardMeta, { color: theme.textSecondary }]}>
          {item.location}
        </ThemedText>
        <View style={styles.cardRow}>
          <View
            style={[
              styles.typePill,
              { backgroundColor: Colors.light.primary + "18" },
            ]}
          >
            <ThemedText
              style={[styles.typePillText, { color: Colors.light.primary }]}
            >
              {capitalize(item.type)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardMeta, { color: theme.textSecondary }]}>
            {item.guests} guests
          </ThemedText>
        </View>
        <View style={styles.cardFooter}>
          <ThemedText style={styles.priceText}>
            <ThemedText style={styles.priceBold}>
              ${item.pricePerNight.toLocaleString()}
            </ThemedText>
            <ThemedText
              style={[styles.priceNight, { color: theme.textSecondary }]}
            >
              {" "}
              / night
            </ThemedText>
          </ThemedText>
          {item.rating != null && (
            <View style={styles.ratingRow}>
              <ThemedText style={styles.ratingStar}>★</ThemedText>
              <ThemedText style={styles.ratingValue}>
                {item.rating.toFixed(1)}
              </ThemedText>
              {item.reviewCount != null && item.reviewCount > 0 && (
                <ThemedText
                  style={[styles.reviewCount, { color: theme.textSecondary }]}
                >
                  ({item.reviewCount})
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Edit chevron */}
      <View style={styles.cardChevron}>
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={14}
          tintColor={theme.textSecondary}
        />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HostListingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [listings, setListings] = useState<HostListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      // /auth/me gives us the current user's id; then /users/:id includes listings for HOSTs
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, { headers });
      if (!meRes.ok) throw new Error("Failed to load profile");
      const me = await meRes.json();

      // The getMe endpoint returns listings array for HOST role
      const raw: HostListing[] = Array.isArray(me.listings)
        ? me.listings.map((l: any) => ({
            id: String(l.id ?? ""),
            title: String(l.title ?? ""),
            location: String(l.location ?? ""),
            type: String(l.type ?? "APARTMENT"),
            pricePerNight: Number(l.pricePerNight ?? 0),
            guests: Number(l.guests ?? 1),
            rating: l.rating != null ? Number(l.rating) : null,
            reviewCount:
              l.reviewCount != null ? Number(l.reviewCount) : undefined,
            photos: Array.isArray(l.photos)
              ? l.photos
                  .map((p: any) => {
                    const url =
                      (typeof p?.url === "string" && p.url) ||
                      (typeof p?.secure_url === "string" && p.secure_url) ||
                      (typeof p?.imageUrl === "string" && p.imageUrl) ||
                      (typeof p?.link === "string" && p.link) ||
                      "";

                    return {
                      id: String(p?.id ?? ""),
                      url,
                    };
                  })
                  // drop empty urls
                  .filter((pp: ListingPhoto) => pp.url.length > 0)
              : [],
          }))
        : [];

      setListings(raw);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.heading}>
            My Listings
          </ThemedText>

          <Pressable
            onPress={() => router.push("/host/add-listing")}
            style={({ pressed }) => [
              styles.addBtn,
              {
                opacity: pressed ? 0.9 : 1,
                backgroundColor: Colors.light.primary + (pressed ? "cc" : ""),
              },
            ]}
          >
            <ThemedText style={styles.addBtnText}>Add listing</ThemedText>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.emptyIcon}>⚠️</ThemedText>
            <ThemedText style={styles.emptyTitle}>
              Couldn't load listings
            </ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            >
              {error}
            </ThemedText>
            <Pressable
              style={[
                styles.retryBtn,
                { backgroundColor: Colors.light.primary },
              ]}
              onPress={fetchListings}
            >
              <ThemedText style={styles.retryText}>Try again</ThemedText>
            </Pressable>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.centered}>
            <SymbolView
              name={{
                ios: "building.2",
                android: "storefront",
                web: "storefront",
              }}
              size={56}
              tintColor={theme.textSecondary}
            />
            <ThemedText style={styles.emptyTitle}>No listings yet</ThemedText>
            <ThemedText
              style={[styles.emptyBody, { color: theme.textSecondary }]}
            >
              Create your first listing to start hosting guests.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchListings}
            renderItem={({ item }) => (
              <HostListingCard
                item={item}
                onPress={() => router.push(`/listing/${item.id}` as any)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.three }} />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  listContent: {
    paddingBottom: Spacing.six,
  },

  // Card
  card: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  cardImage: {
    width: 96,
    height: 96,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 13,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: 2,
  },
  typePill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.one,
  },
  priceText: { fontSize: 14 },
  priceBold: { fontWeight: "700", fontSize: 14 },
  priceNight: { fontSize: 13 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingStar: { fontSize: 12 },
  ratingValue: { fontSize: 13, fontWeight: "600" },
  reviewCount: { fontSize: 12 },
  cardChevron: {
    paddingRight: Spacing.two,
    paddingLeft: Spacing.one,
  },

  // States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  retryBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
