import { createBooking, type BookingApiError } from "@/api/bookings";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/store/auth-store";
import type { CreateBookingInput } from "@/types/booking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export default function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId?: string;
    pricePerNight?: string;
    dateLabel?: string;
    startDate?: string;
    endDate?: string;
    nights?: string;
    guestsMin?: string;
  }>();

  const listingId = String(params.listingId ?? "");
  const pricePerNight = Number(params.pricePerNight ?? "0");
  const dateLabel = String(params.dateLabel ?? "");
  const startDate = String(params.startDate ?? "");
  const endDate = String(params.endDate ?? "");

  const guestsMin = Number(params.guestsMin ?? "1");
  const nights = Math.max(1, Number(params.nights ?? "1"));

  const [guests, setGuests] = useState<number>(Math.max(guestsMin, 1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => pricePerNight * nights, [pricePerNight, nights]);

  async function requireAuthOrRedirect(): Promise<boolean> {
    const token = await getToken();
    if (!token) {
      router.replace({
        pathname: "/profile",
        params: { returnTo: `/booking/Checkout` },
      });
      return false;
    }
    return true;
  }

  async function onConfirm() {
    setError(null);
    const ok = await requireAuthOrRedirect();
    if (!ok) return;

    if (!listingId || !startDate || !endDate) {
      setError("Missing booking details.");
      return;
    }

    const input: CreateBookingInput = {
      listingId,
      checkIn: startDate,
      checkOut: endDate,
      guests,
    };

    setIsSubmitting(true);
    try {
      const booking = await createBooking(input);
      router.replace({
        pathname: "/booking/BookingSuccess",
        params: {
          bookingId: booking.id,
          listingId: booking.listingId,
        },
      } as any);
    } catch (e) {
      const err = e as BookingApiError;
      // Common conflict
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        (err as BookingApiError).status === 409
      ) {
        setError(err.message || "Those dates are no longer available.");
        return;
      }
      setError(err?.message ?? "Failed to create booking.");
      Toast.show({
        type: "error",
        text1: "Booking failed",
        position: "bottom",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Checkout
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {dateLabel}
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Guests</ThemedText>
        <View style={styles.row}>
          <Pressable
            onPress={() => setGuests((v) => Math.max(guestsMin, v - 1))}
            style={[
              styles.stepBtn,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          >
            <ThemedText style={styles.stepText}>-</ThemedText>
          </Pressable>
          <View style={[styles.nightsBox, { borderColor: theme.border }]}>
            <ThemedText style={styles.value}>{guests}</ThemedText>
          </View>
          <Pressable
            onPress={() => setGuests((v) => Math.min(20, v + 1))}
            style={[
              styles.stepBtn,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          >
            <ThemedText style={styles.stepText}>+</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Price</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.meta}>
          ${pricePerNight.toLocaleString()} × {nights} nights
        </ThemedText>
        <ThemedText style={styles.total}>
          Total: ${total.toLocaleString()}
        </ThemedText>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          {
            backgroundColor: Colors.light.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        disabled={isSubmitting}
        onPress={onConfirm}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.primaryBtnText}>Confirm</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { marginTop: Spacing.five, gap: Spacing.two },
  title: { fontWeight: "700", fontSize: 18 },
  subtitle: { fontSize: 14 },

  card: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },

  sectionTitle: { fontWeight: "700" },
  meta: { fontSize: 14 },
  total: { fontSize: 16, fontWeight: "800", marginTop: Spacing.two },

  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: { fontSize: 22, fontWeight: "800" },
  nightsBox: {
    minWidth: 72,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  value: { fontSize: 18, fontWeight: "700" },

  primaryBtn: {
    marginTop: Spacing.two,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  errorText: { color: "#ff4d4f", fontWeight: "600", paddingTop: Spacing.two },
});
