import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  ActivityIndicator,
  Pressable,
  ScrollView,
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

// ─── Palette ──────────────────────────────────────────────────────────────────

const P = {
  primary: Colors.light.primary,   // #FF385C
  success: "#00C48C",
  warning: "#FFB547",
  danger:  "#FF6B6B",
  chart:   "#FF385C",
  chartMuted: "rgba(255,56,92,0.18)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FeaturedListing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  type: string;
  guests: number;
  photos: { id: string; url: string }[];
};

type MonthPoint = { month: string; revenue: number; bookings: number };
type StatusPoint = { status: string; count: number };

type AnalyticsSummary = {
  totalRevenue: number;
  totalBookings: number;
  avgNightly: number;
  occupancyRate: number;
};

type DashboardData = {
  listing: FeaturedListing | null;
  listingCount: number;
  summary: AnalyticsSummary;
  revenueByMonth: MonthPoint[];
  statusBreakdown: StatusPoint[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("default", { month: "short" });
}

function fmtMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  const theme = useTheme();
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.kpiCard, { borderColor: theme.border }]}
    >
      <View style={[styles.kpiDot, { backgroundColor: accent + "28" }]}>
        <View style={[styles.kpiDotInner, { backgroundColor: accent }]} />
      </View>
      <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.kpiValue, { color: theme.text }]}>
        {value}
      </ThemedText>
      {sub ? (
        <ThemedText style={[styles.kpiSub, { color: theme.textSecondary }]}>
          {sub}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────

const BAR_MAX_H = 100;

function RevenueChart({ data }: { data: MonthPoint[] }) {
  const theme = useTheme();
  const barAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (data.length === 0) return;
    barAnims.current = data.map(() => new Animated.Value(0));
    Animated.stagger(
      55,
      barAnims.current.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 52,
          friction: 7,
        }),
      ),
    ).start();
  }, [data]);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.chartCard, { borderColor: theme.border }]}
    >
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle}>Revenue</ThemedText>
        <ThemedText style={[styles.chartSub, { color: theme.textSecondary }]}>
          Last 6 months
        </ThemedText>
      </View>

      {/* Y-axis ghost lines */}
      <View style={styles.chartBody}>
        <View style={styles.gridLines} pointerEvents="none">
          {[1, 0.66, 0.33].map((f) => (
            <View
              key={f}
              style={[
                styles.gridLine,
                {
                  bottom: f * BAR_MAX_H,
                  borderColor: theme.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Bars */}
        <View style={styles.barsRow}>
          {data.map((item, i) => {
            const targetH =
              maxRevenue > 0
                ? Math.max(4, (item.revenue / maxRevenue) * BAR_MAX_H)
                : 4;
            const anim = barAnims.current[i];
            const animHeight = anim
              ? anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, targetH],
                })
              : 0;

            const isTop = item.revenue === maxRevenue && item.revenue > 0;

            return (
              <View key={item.month} style={styles.barCol}>
                {/* Revenue label above bar */}
                {item.revenue > 0 && (
                  <ThemedText
                    style={[
                      styles.barTopLabel,
                      {
                        color: isTop ? P.primary : theme.textSecondary,
                        fontWeight: isTop ? "700" : "400",
                      },
                    ]}
                  >
                    {fmtMoney(item.revenue)}
                  </ThemedText>
                )}

                {/* Bar */}
                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        height: animHeight,
                        backgroundColor: isTop ? P.primary : P.chartMuted,
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                      },
                    ]}
                  />
                </View>

                {/* Month label */}
                <ThemedText
                  style={[styles.barLabel, { color: theme.textSecondary }]}
                >
                  {shortMonth(item.month)}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    </ThemedView>
  );
}

// ─── Status Breakdown ─────────────────────────────────────────────────────────

function StatusBreakdown({ data }: { data: StatusPoint[] }) {
  const theme = useTheme();
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const segAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(segAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [data]);

  const colorFor = (status: string) => {
    if (status === "CONFIRMED") return P.success;
    if (status === "PENDING")   return P.warning;
    return P.danger;
  };

  const labelFor = (status: string) => {
    if (status === "CONFIRMED") return "Confirmed";
    if (status === "PENDING")   return "Pending";
    return "Cancelled";
  };

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.chartCard, { borderColor: theme.border }]}
    >
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle}>Bookings</ThemedText>
        <ThemedText style={[styles.chartSub, { color: theme.textSecondary }]}>
          {totalCount} total
        </ThemedText>
      </View>

      {/* Segmented bar */}
      <View style={styles.segBar}>
        {totalCount === 0 ? (
          <View
            style={[
              styles.segFill,
              { flex: 1, backgroundColor: theme.border, borderRadius: 6 },
            ]}
          />
        ) : (
          data
            .filter((d) => d.count > 0)
            .map((d, i, arr) => {
              const flex = d.count / totalCount;
              const isFirst = i === 0;
              const isLast = i === arr.length - 1;
              return (
                <Animated.View
                  key={d.status}
                  style={[
                    styles.segFill,
                    {
                      flex: segAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, flex],
                      }),
                      backgroundColor: colorFor(d.status),
                      borderTopLeftRadius: isFirst ? 6 : 0,
                      borderBottomLeftRadius: isFirst ? 6 : 0,
                      borderTopRightRadius: isLast ? 6 : 0,
                      borderBottomRightRadius: isLast ? 6 : 0,
                    },
                  ]}
                />
              );
            })
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.status} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colorFor(d.status) }]}
            />
            <ThemedText
              style={[styles.legendLabel, { color: theme.textSecondary }]}
            >
              {labelFor(d.status)}
            </ThemedText>
            <ThemedText style={styles.legendCount}>{d.count}</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DEFAULT_SUMMARY: AnalyticsSummary = {
  totalRevenue: 0,
  totalBookings: 0,
  avgNightly: 0,
  occupancyRate: 0,
};

export default function HostDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [data, setData]           = useState<DashboardData>({
    listing: null,
    listingCount: 0,
    summary: DEFAULT_SUMMARY,
    revenueByMonth: [],
    statusBreakdown: [],
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();

      // Fetch both endpoints in parallel
      const [meRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/me`, { headers }),
        fetch(`${API_BASE_URL}/analytics/host`, { headers }),
      ]);

      if (!meRes.ok)
        throw new Error(`Profile error (${meRes.status})`);
      if (!analyticsRes.ok)
        throw new Error(`Analytics error (${analyticsRes.status})`);

      const [me, analytics] = await Promise.all([
        meRes.json(),
        analyticsRes.json(),
      ]);

      // Parse listings
      const rawListings: any[] = Array.isArray(me.listings) ? me.listings : [];
      const first = rawListings[0] ?? null;

      const listing: FeaturedListing | null = first
        ? {
            id: String(first.id ?? ""),
            title: String(first.title ?? "Untitled"),
            location: String(first.location ?? ""),
            pricePerNight: Number(first.pricePerNight ?? 0),
            type: String(first.type ?? "APARTMENT"),
            guests: Number(first.guests ?? 1),
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

      setData({
        listing,
        listingCount: rawListings.length,
        summary: analytics.summary ?? DEFAULT_SUMMARY,
        revenueByMonth: Array.isArray(analytics.revenueByMonth)
          ? analytics.revenueByMonth
          : [],
        statusBreakdown: Array.isArray(analytics.statusBreakdown)
          ? analytics.statusBreakdown
          : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={P.primary} />
        <ThemedText style={[styles.loadingLabel, { color: theme.textSecondary }]}>
          Loading analytics…
        </ThemedText>
      </ThemedView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorTitle}>Couldn't load dashboard</ThemedText>
        <ThemedText style={[styles.errorBody, { color: theme.textSecondary }]}>
          {error}
        </ThemedText>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: P.primary }]}
          onPress={load}
        >
          <ThemedText style={styles.retryText}>Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const { listing, listingCount, summary, revenueByMonth, statusBreakdown } =
    data;
  const coverUrl = listing?.photos?.[0]?.url ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.heading}>Dashboard</ThemedText>
              <ThemedText
                style={[styles.subheading, { color: theme.textSecondary }]}
              >
                {listingCount} listing{listingCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.addBtn, { backgroundColor: P.primary }]}
              onPress={() => router.push("/host/add-listing")}
            >
              <ThemedText style={styles.addBtnText}>+ Add</ThemedText>
            </Pressable>
          </View>

          {/* ── Hero card ───────────────────────────────────────────────── */}
          <Pressable
            style={styles.heroCard}
            onPress={() =>
              listing
                ? router.push(`/listing/${listing.id}` as any)
                : router.push("/host/add-listing")
            }
          >
            {coverUrl ? (
              <>
                <Image
                  source={{ uri: coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(255,80,30,0.55)", "rgba(255,200,40,0.45)"]}
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
                pointerEvents="none"
                style={[styles.hexDot, { top: pos.top, left: pos.left }]}
              />
            ))}

            <View style={styles.heroContent}>
              <View style={styles.typePill}>
                <ThemedText style={styles.typePillText}>
                  {listing
                    ? listing.type.charAt(0) +
                      listing.type.slice(1).toLowerCase()
                    : "Host"}
                </ThemedText>
              </View>
              <ThemedText style={styles.heroTitle} numberOfLines={2}>
                {listing?.title ?? "No listings yet"}
              </ThemedText>
              <ThemedText style={styles.heroSub} numberOfLines={1}>
                {listing
                  ? `${listing.location}  ·  Up to ${listing.guests} guests`
                  : "Create your first listing to start hosting"}
              </ThemedText>
              <View style={styles.heroBtn}>
                <ThemedText style={styles.heroBtnText}>
                  {listing ? "View listing" : "Add listing"}
                </ThemedText>
              </View>
            </View>
          </Pressable>

          {/* ── KPI grid ────────────────────────────────────────────────── */}
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Revenue"
              value={fmtMoney(summary.totalRevenue)}
              accent={P.success}
              sub="confirmed"
            />
            <KpiCard
              label="Bookings"
              value={String(summary.totalBookings)}
              accent={P.primary}
              sub="confirmed"
            />
            <KpiCard
              label="Avg / night"
              value={fmtMoney(summary.avgNightly)}
              accent={P.warning}
            />
            <KpiCard
              label="Occupancy"
              value={`${summary.occupancyRate}%`}
              accent={P.chart}
              sub="last 30 days"
            />
          </View>

          {/* ── Revenue bar chart ────────────────────────────────────────── */}
          <RevenueChart data={revenueByMonth} />

          {/* ── Status breakdown ─────────────────────────────────────────── */}
          <StatusBreakdown data={statusBreakdown} />

          {/* ── Manage shortcut ──────────────────────────────────────────── */}
          <Pressable
            style={[styles.manageRow, { borderColor: theme.border }]}
            onPress={() => router.push("/host/listings")}
          >
            <ThemedText style={styles.manageText}>
              Manage all listings
            </ThemedText>
            <ThemedText style={[styles.manageArrow, { color: P.primary }]}>
              →
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1 },
  safeArea:     { flex: 1, paddingHorizontal: Spacing.four },
  scroll:       { paddingBottom: 80 },
  centered:     {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.five,
  },
  loadingLabel: { fontSize: 14, marginTop: Spacing.two },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  heading:    { fontSize: 28, fontWeight: "800", lineHeight: 34 },
  subheading: { fontSize: 13, marginTop: 2 },
  addBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 210,
    marginBottom: Spacing.four,
    justifyContent: "flex-end",
  },
  hexDot: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    transform: [{ rotate: "15deg" }],
  },
  heroContent:  { padding: Spacing.four, gap: 4 },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  typePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 26 },
  heroSub:   { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  heroBtn: {
    alignSelf: "flex-start",
    marginTop: Spacing.two,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
  },
  heroBtnText: { color: "#333", fontWeight: "700", fontSize: 13 },

  // KPI grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  kpiCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 4,
  },
  kpiDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kpiDotInner: { width: 10, height: 10, borderRadius: 5 },
  kpiLabel:    { fontSize: 12 },
  kpiValue:    { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  kpiSub:      { fontSize: 11 },

  // Chart card shared
  chartCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  chartTitle: { fontSize: 16, fontWeight: "700" },
  chartSub:   { fontSize: 12 },

  // Bar chart
  chartBody: {
    height: BAR_MAX_H + 36,
    position: "relative",
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_MAX_H + 36,
    paddingBottom: 24,     // room for month labels
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: BAR_MAX_H + 36,
    paddingHorizontal: 3,
  },
  barTrack: {
    width: "100%",
    height: BAR_MAX_H,
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
  },
  barTopLabel: {
    fontSize: 9,
    marginBottom: 3,
    textAlign: "center",
  },
  barLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
  },

  // Status breakdown
  segBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
  },
  segFill: { height: "100%" },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.one,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: { fontSize: 12 },
  legendCount: { fontSize: 12, fontWeight: "700" },

  // Manage row
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  manageText:  { fontSize: 15, fontWeight: "600" },
  manageArrow: { fontSize: 20, fontWeight: "700" },

  // Error
  errorTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  errorBody:  { fontSize: 14, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});