import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  getHostBookings,
  hostCancelBooking,
  hostConfirmBooking,
} from "@/api/hostBookings";
import BookingHostRow from "@/components/booking-host-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Booking } from "@/types/booking";
import { showToast } from "@/utils/toast";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

function isUpcoming(booking: Booking): boolean {
  const start = booking.startDate ? new Date(booking.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return start >= now;
}

export default function HostBookingScreen() {
  const theme = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hostBookings = useMemo(() => {
    return bookings.filter(isUpcoming);
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return hostBookings;
    return hostBookings.filter((booking) => {
      const listingTitle = booking.listing?.title ?? "";
      const listingLocation = booking.listing?.location ?? "";
      return (
        listingTitle.toLowerCase().includes(normalized) ||
        listingLocation.toLowerCase().includes(normalized) ||
        String(booking.id).toLowerCase().includes(normalized)
      );
    });
  }, [hostBookings, searchQuery]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHostBookings({
        page: 1,
        limit: 50,
      });
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (cancelled) return;
        await load();
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleConfirm = useCallback(async (bookingId: string) => {
    try {
      await hostConfirmBooking(bookingId);
      showToast({ type: "success", text1: "Booking confirmed" });
      // optimistic: filter it out from the pending list
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (e) {
      showToast({ type: "error", text1: "Failed to confirm booking" });
      throw e;
    }
  }, []);

  const handleCancel = useCallback(async (bookingId: string) => {
    try {
      await hostCancelBooking(bookingId);
      showToast({ type: "success", text1: "Booking cancelled" });
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (e) {
      showToast({ type: "error", text1: "Failed to cancel booking" });
      throw e;
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.heading}>
          Booking Requests
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subheading}>
          Duis vulputate metus fringilla, aliquet ex sed, pulvinar justo.
        </ThemedText>

        <View style={styles.toolbar}>
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search bookings"
            placeholderTextColor={theme.textSecondary}
            style={styles.searchInput}
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.emptyIcon}>⚠️</ThemedText>
            <ThemedText style={styles.emptyTitle}>
              Couldn't load bookings
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
              {error}
            </ThemedText>
            <Pressable
              style={[
                styles.retryBtn,
                { backgroundColor: Colors.light.primary },
              ]}
              onPress={load}
            >
              <ThemedText style={styles.retryText}>Try again</ThemedText>
            </Pressable>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.centered}>
            <SymbolView
              name={
                { ios: "calendar", android: "event", web: "calendar" } as any
              }
              size={56}
              tintColor={theme.textSecondary}
            />
            <ThemedText style={styles.emptyTitle}>
              No booking requests found
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
              Try a different search term or refresh to load the latest
              requests.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.tableWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <FlatList
                  data={filteredBookings}
                  scrollEnabled={false}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                  renderItem={({ item }) => (
                    <BookingHostRow
                      booking={item}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                    />
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                  ListHeaderComponent={() => (
                    <View style={styles.tableHeader}>
                      <ThemedText style={styles.headerCell}>
                        Customer
                      </ThemedText>
                      <ThemedText style={styles.headerCell}>
                        Booking date
                      </ThemedText>
                      <ThemedText style={styles.headerCell}>Persons</ThemedText>
                      <ThemedText style={styles.headerCell}>Price</ThemedText>
                      <ThemedText style={styles.headerCell}>Client</ThemedText>
                      <ThemedText style={styles.headerCell}>Status</ThemedText>
                      <ThemedText
                        style={[styles.headerCell, styles.headerActionCell]}
                      >
                        Action
                      </ThemedText>
                    </View>
                  )}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // NOTE: this screen is themed dynamically; some style values reference `theme`.
  // `StyleSheet.create` is executed at module scope, so we avoid referencing `theme` there.
  // Theme-dependent colors are handled inline in JSX instead.

  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  heading: { marginBottom: Spacing.two },
  subheading: {
    marginBottom: Spacing.four,
    fontSize: 14,
    lineHeight: 20,
  },
  toolbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    fontSize: 15,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    gap: Spacing.two,
  },
  headerCell: {
    flex: 1,
    minWidth: 88,
    fontSize: 12,
    fontWeight: "700",
  },
  headerActionCell: {
    flex: 1.3,
    minWidth: 90,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: Spacing.two,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: Spacing.two,
  },
  retryBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
  },
  retryText: { fontWeight: "600", fontSize: 15 },
  tableWrap: { flex: 1 },
  horizontalScroller: { flex: 1 },
  listContent: { paddingBottom: Spacing.six },
});
