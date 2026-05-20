import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authHeaders } from "@/store/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeaturedListing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  type: string;
  guests: number;
  rating: number | null;
  reviewCount?: number;
  photos: { id: string; url: string }[];
};

type DashboardState = {
  listing: FeaturedListing | null;
  listingCount: number;
  isLoading: boolean;
  error: string | null;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.statCard, { borderColor: theme.border }]}
    >
      <View style={styles.statContent}>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={styles.statValue}>{value}</ThemedText>
      </View>
      <View style={styles.statIcon}>{icon}</View>
    </ThemedView>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

function MiniChartIcon() {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.bar, { height: 12, opacity: 0.5 }]} />
      <View style={[styles.bar, { height: 20 }]} />
      <View style={[styles.bar, { height: 16, opacity: 0.7 }]} />
      <View style={[styles.bar, { height: 24 }]} />
    </View>
  );
}

function PieIcon() {
  return (
    <View style={styles.pieWrap}>
      <View style={styles.pieOuter}>
        <View style={styles.pieInner} />
      </View>
    </View>
  );
}

function RevenueIcon() {
  return (
    <View style={styles.revenueIconWrap}>
      <View style={styles.coinStack}>
        <View style={[styles.coin, { marginTop: 6 }]} />
        <View style={[styles.coin, { marginTop: 3 }]} />
        <View style={styles.coin} />
      </View>
      <View style={styles.arrowUp}>
        <View style={styles.arrowHead} />
        <View style={styles.arrowLine} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HostDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [state, setState] = useState<DashboardState>({
    listing: null,
    listingCount: 0,
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const me = await res.json();

      const rawListings: any[] = Array.isArray(me.listings) ? me.listings : [];
      const listingCount = rawListings.length;

      const first = rawListings[0] ?? null;
      const listing: FeaturedListing | null = first
        ? {
            id: String(first.id ?? ""),
            title: String(first.title ?? "Untitled"),
            location: String(first.location ?? ""),
            pricePerNight: Number(first.pricePerNight ?? 0),
            type: String(first.type ?? "APARTMENT"),
            guests: Number(first.guests ?? 1),
            rating: first.rating != null ? Number(first.rating) : null,
            reviewCount:
              first.reviewCount != null ? Number(first.reviewCount) : undefined,
            photos: Array.isArray(first.photos)
              ? first.photos
                  .map((p: any) => ({
                    id: String(p?.id ?? ""),
                    url:
                      typeof p?.url === "string"
                        ? p.url
                        : typeof p?.secure_url === "string"
                          ? p.secure_url
                          : "",
                  }))
                  .filter((p: { url: string }) => p.url.length > 0)
              : [],
          }
        : null;

      setState({ listing, listingCount, isLoading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : "Something went wrong",
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { listing, listingCount, isLoading, error } = state;
  const coverUrl = listing?.photos?.[0]?.url ?? null;

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorTitle}>Couldn't load dashboard</ThemedText>
        <ThemedText style={[styles.errorBody, { color: theme.textSecondary }]}>
          {error}
        </ThemedText>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: Colors.light.primary }]}
          onPress={load}
        >
          <ThemedText style={styles.retryText}>Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.heading}>Dashboard</ThemedText>
            <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
              {listingCount} listing{listingCount !== 1 ? "s" : ""}
            </ThemedText>
          </View>

          {/* Hero card */}
          <Pressable
            style={styles.heroCard}
            onPress={() =>
              listing
                ? router.push(`/listing/${listing.id}` as any)
                : router.push("/host/add-listing")
            }
          >
            {/* Background */}
            {coverUrl ? (
              <>
                <Image
                  source={{ uri: coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(255,80,30,0.6)", "rgba(255,200,40,0.5)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <LinearGradient
                colors={["#FF5A32", "#FFD93D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            {/* Decorative hex dots */}
            {[
              { top: 10, left: 10 },
              { top: 10, left: 66 },
              { top: 10, left: 122 },
              { top: 52, left: 38 },
              { top: 52, left: 94 },
              { top: 52, left: 150 },
            ].map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.hexDot,
                  { top: pos.top, left: pos.left },
                ]}
                pointerEvents="none"
              />
            ))}

            {/* Card content */}
            <View style={styles.heroContent}>
              <View style={styles.typePill}>
                <ThemedText style={styles.typePillText}>
                  {listing
                    ? listing.type.charAt(0) + listing.type.slice(1).toLowerCase()
                    : "Host"}
                </ThemedText>
              </View>

              <ThemedText style={styles.heroTitle} numberOfLines={2}>
                {listing ? listing.title : "No listings yet"}
              </ThemedText>

              <ThemedText style={styles.heroSub} numberOfLines={1}>
                {listing
                  ? `${listing.location}  ·  Up to ${listing.guests} guests`
                  : "Create your first listing to start hosting"}
              </ThemedText>

              <Pressable
                style={styles.heroBtn}
                onPress={() =>
                  listing
                    ? router.push(`/listing/${listing.id}` as any)
                    : router.push("/host/add-listing")
                }
              >
                <ThemedText style={styles.heroBtnText}>
                  {listing ? "View listing" : "Add listing"}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>

          {/* Stat cards */}
          <View style={styles.statsCol}>
            <StatCard
              label="Total Listings"
              value={String(listingCount)}
              icon={<MiniChartIcon />}
            />

            <StatCard
              label="Price / night"
              value={
                listing ? `$${listing.pricePerNight.toLocaleString()}` : "—"
              }
              icon={<PieIcon />}
            />

            <StatCard
              label="Rating"
              value={
                listing?.rating != null
                  ? `★ ${listing.rating.toFixed(1)}`
                  : "—"
              }
              icon={<RevenueIcon />}
            />
          </View>

          {/* Manage shortcut */}
          <Pressable
            style={[styles.manageRow, { borderColor: theme.border }]}
            onPress={() => router.push("/host/listings")}
          >
            <ThemedText style={styles.manageText}>Manage all listings</ThemedText>
            <ThemedText style={[styles.manageArrow, { color: Colors.light.primary }]}>
              →
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ICON_COLOR = Colors.light.primary;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  scroll: { paddingBottom: Spacing.six },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.five,
  },

  // Header
  header: { marginTop: Spacing.five, marginBottom: Spacing.four, gap: 2 },
  heading: { fontSize: 28, fontWeight: "800", lineHeight: 34 },
  subheading: { fontSize: 14 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 210,
    marginBottom: Spacing.four,
    position: "relative",
    justifyContent: "flex-end",
  },
  hexDot: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    transform: [{ rotate: "15deg" }],
  },
  heroContent: { padding: Spacing.four, gap: Spacing.one },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: Spacing.one,
  },
  typePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 26 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  heroBtn: {
    alignSelf: "flex-start",
    marginTop: Spacing.two,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
  },
  heroBtnText: { color: "#333", fontWeight: "700", fontSize: 13 },

  // Stat cards
  statsCol: { gap: Spacing.three, marginBottom: Spacing.four },
  statCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statContent: { gap: 4 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  statIcon: { width: 56, alignItems: "center" },

  // Bar chart icon
  iconWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 28,
  },
  bar: { width: 7, borderRadius: 3, backgroundColor: ICON_COLOR },

  // Pie icon
  pieWrap: { alignItems: "center" },
  pieOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 5,
    borderColor: ICON_COLOR,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  pieInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ICON_COLOR,
    opacity: 0.25,
  },

  // Revenue icon
  revenueIconWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  coinStack: { alignItems: "center", gap: 2 },
  coin: {
    width: 22,
    height: 7,
    borderRadius: 4,
    backgroundColor: ICON_COLOR,
    opacity: 0.85,
  },
  arrowUp: { alignItems: "center", marginBottom: 4 },
  arrowLine: {
    width: 2.5,
    height: 14,
    backgroundColor: ICON_COLOR,
    borderRadius: 2,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: ICON_COLOR,
    marginBottom: -2,
  },

  // Manage row
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  manageText: { fontSize: 15, fontWeight: "600" },
  manageArrow: { fontSize: 20, fontWeight: "700" },

  // Error
  errorTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  errorBody: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});