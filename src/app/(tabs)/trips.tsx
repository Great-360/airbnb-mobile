import { getUserBookings } from "@/api/bookings";
import { ListingCard } from "@/components/listing-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { getToken } from "@/store/auth-store";
import { type Booking } from "@/types/booking";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

function toListingForCard(b: Booking) {
  return {
    id: b.listing?.id ?? b.listingId,
    title: b.listing?.title ?? "Trip",
    description: "",
    location: b.listing?.location ?? "",
    pricePerNight: b.totalPrice ? b.totalPrice / 1 : 0,
    guests: b.guests ?? 1,
    type: "APARTMENT" as any,
    amenities: [],
    rating: null,
    photos: b.listing?.coverUrl
      ? [{ id: "0", url: b.listing.coverUrl, publicId: "" }]
      : [],
    host: { name: "", avatar: null },
  };
}

function formatDate(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

export default function TripsScreen() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);

  const dedupedBookings = useMemo(() => {
    const seen = new Set<string>();
    const out: Booking[] = [];

    for (const b of bookings) {
      if (seen.has(b.listingId)) continue;
      seen.add(b.listingId);
      out.push(b);
    }

    return out;
  }, [bookings]);

  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserBookings();
      setBookings(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function sync() {
        // If user is logged out, immediately clear stale trips.
        const token = await getToken();
        if (cancelled) return;

        if (!token) {
          setBookings([]);
          setIsLoading(false);
          return;
        }

        await load();
      }

      setIsLoading(true);
      sync().catch(() => {
        if (cancelled) return;
        setBookings([]);
        setIsLoading(false);
      });

      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
      >
        <ThemedText type="subtitle" style={styles.heading}>
          Trips
        </ThemedText>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <SymbolView
              name={{ ios: "airplane", android: "flight", web: "flight" }}
              size={48}
              tintColor={Colors.light.primary}
            />
            <ThemedText type="default" style={styles.emptyTitle}>
              No Trips booked Yet
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
              Time to dust off your bags and start planning your next adventure.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={dedupedBookings}
            keyExtractor={(item) => String(item.listingId)}
            contentContainerStyle={{ paddingBottom: Spacing.four }}
            scrollEnabled
            renderItem={({ item: b }) => {
              const listing = toListingForCard(b);
              const dateText = formatDate(b.startDate, b.endDate);
              return (
                <View>
                  <Pressable
                    onPress={() =>
                      router.push(`/listing/${b.listingId}` as any)
                    }
                  >
                    <ListingCard
                      listing={listing as any}
                      isWishlisted={false}
                      onWishlistPress={() => {}}
                      onPress={() =>
                        router.push(`/listing/${b.listingId}` as any)
                      }
                    />
                  </Pressable>

                  {dateText ? (
                    <ThemedText
                      themeColor="textSecondary"
                      style={{
                        marginHorizontal: Spacing.four,
                        marginTop: -Spacing.three,
                        marginBottom: Spacing.two,
                      }}
                    >
                      {dateText}
                    </ThemedText>
                  ) : null}

                  <ThemedText
                    themeColor="textSecondary"
                    style={{
                      marginHorizontal: Spacing.four,
                      marginBottom: Spacing.four,
                      fontWeight: "600",
                    }}
                  >
                    Already booked
                  </ThemedText>

                  <View style={{ height: 8 }} />
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    lineHeight: 22,
  },
});
