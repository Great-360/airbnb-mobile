import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import type { Booking } from "@/types/booking";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

function normalizeStatus(status?: string): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

function formatCompactDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatPrice(totalPrice?: number, currency?: string): string {
  if (totalPrice == null) return "—";
  return currency ? `${currency}${totalPrice}` : `$${totalPrice}`;
}

export default function HostBookingRow({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: Booking;
  onConfirm: (id: string) => Promise<void> | void;
  onCancel: (id: string) => Promise<void> | void;
}) {
  const status = normalizeStatus(booking.status);
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);

  const title = booking.listing?.title ?? "Listing";
  const bookingDate = useMemo(() => {
    const from = formatCompactDate(booking.startDate);
    const to = formatCompactDate(booking.endDate);
    return from && to ? `${from} – ${to}` : from || to || "—";
  }, [booking.endDate, booking.startDate]);

  const client = booking.listing?.location ?? "Guest details";
  const guests = booking.guests != null ? String(booking.guests) : "—";
  const totalPrice = formatPrice(booking.totalPrice, booking.currency);
  const canAct = status === "PENDING";

  const statusColor =
    status === "PENDING"
      ? Colors.light.primary
      : status === "CONFIRMED"
        ? "#22c55e"
        : status === "CANCELLED"
          ? "#ff4d4f"
          : Colors.light.text;

  return (
    <ThemedView
      style={[styles.row, { opacity: status === "CANCELLED" ? 0.8 : 1 }]}
    >
      <View style={styles.cell}>
        <ThemedText style={styles.cellTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={styles.cellMeta}
          numberOfLines={1}
        >
          {client}
        </ThemedText>
      </View>

      <View style={styles.cell}>
        <ThemedText style={styles.cellValue}>{bookingDate}</ThemedText>
      </View>

      <View style={styles.cell}>
        <ThemedText style={styles.cellValue}>{guests}</ThemedText>
      </View>

      <View style={styles.cell}>
        <ThemedText style={styles.cellValue}>{totalPrice}</ThemedText>
      </View>

      <View style={styles.cell}>
        <ThemedText style={styles.cellValue}>{client}</ThemedText>
      </View>

      <View style={styles.cell}>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText style={[styles.statusText, { color: statusColor }]}>
            {status === "PENDING"
              ? "Pending"
              : status === "CONFIRMED"
                ? "Confirmed"
                : status === "CANCELLED"
                  ? "Canceled"
                  : status || "Unknown"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionCell}>
        <Pressable
          disabled={!canAct || busy !== null}
          onPress={async () => {
            if (!canAct) return;
            setBusy("confirm");
            try {
              await onConfirm(booking.id);
            } finally {
              setBusy(null);
            }
          }}
          style={({ pressed }) => [
            styles.btn,
            styles.btnConfirm,
            (!canAct || busy) && { opacity: 0.5 },
            pressed && canAct && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <ThemedText style={styles.btnText}>
            {busy === "confirm" ? "Confirming…" : "Approve"}
          </ThemedText>
        </Pressable>

        <Pressable
          disabled={!canAct || busy !== null}
          onPress={async () => {
            if (!canAct) return;
            setBusy("cancel");
            try {
              await onCancel(booking.id);
            } finally {
              setBusy(null);
            }
          }}
          style={({ pressed }) => [
            styles.btn,
            styles.btnCancel,
            (!canAct || busy) && { opacity: 0.5 },
            pressed && canAct && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <ThemedText style={styles.btnText}>
            {busy === "cancel" ? "Cancelling…" : "Decline"}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    backgroundColor: Colors.light.background,
  },
  cell: {
    flex: 1,
    minWidth: 80,
    justifyContent: "center",
  },
  actionCell: {
    flex: 1.3,
    minWidth: 120,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
  cellTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cellMeta: {
    marginTop: Spacing.one,
    fontSize: 12,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.one,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  btn: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
  },
  btnConfirm: {
    backgroundColor: "rgba(34,197,94,0.95)",
  },
  btnCancel: {
    backgroundColor: "rgba(255,77,79,0.95)",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
});
