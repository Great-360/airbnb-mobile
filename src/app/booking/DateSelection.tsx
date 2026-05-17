import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function formatDateLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString(undefined, opts);
  const e = end.toLocaleDateString(undefined, opts);
  return `${s} – ${e}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function DateSelectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId?: string;
    pricePerNight?: string;
    dateLabel?: string;
  }>();

  const listingId = String(params.listingId ?? "");
  const pricePerNight = Number(params.pricePerNight ?? "0");

  const today = useMemo(() => new Date(), []);
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const d = addDays(today, 7);
    // YYYY-MM-DD
    return d.toISOString().slice(0, 10);
  });
  const [nights, setNights] = useState<number>(3);
  const guestsMin = 1;

  const parsedStart = useMemo(() => {
    const [y, m, d] = startDateStr.split("-").map((x) => Number(x));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [startDateStr]);

  const endDate = useMemo(() => {
    if (!parsedStart) return null;
    return addDays(parsedStart, Math.max(1, nights));
  }, [parsedStart, nights]);

  const dateLabel = useMemo(() => {
    if (!parsedStart || !endDate) return params.dateLabel ?? "";
    return formatDateLabel(parsedStart, endDate);
  }, [parsedStart, endDate, params.dateLabel]);

  const total = useMemo(() => {
    const n = Math.max(1, nights);
    return pricePerNight * n;
  }, [pricePerNight, nights]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Select your dates
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {listingId ? dateLabel : ""}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <ThemedText style={styles.label}>Start date (YYYY-MM-DD)</ThemedText>
        <TextInput
          value={startDateStr}
          onChangeText={setStartDateStr}
          placeholder="2026-06-01"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
        />

        <ThemedText style={[styles.label, { marginTop: Spacing.four }]}>
          Nights
        </ThemedText>
        <View style={styles.row}>
          <Pressable
            onPress={() => setNights((v) => Math.max(1, v - 1))}
            style={[
              styles.stepBtn,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={styles.stepText}>-</ThemedText>
          </Pressable>
          <View style={[styles.nightsBox, { borderColor: theme.border }]}>
            <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
              {nights}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setNights((v) => Math.min(28, v + 1))}
            style={[
              styles.stepBtn,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={styles.stepText}>+</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[styles.summary, { color: theme.textSecondary }]}>
          ${pricePerNight.toLocaleString()} × {Math.max(1, nights)} nights ={" "}
          {total.toLocaleString()}
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: Colors.light.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => {
            if (!listingId) return;
            if (!parsedStart || !endDate) return;
            router.push({
              pathname: "/booking/Checkout",
              params: {
                listingId,
                pricePerNight: String(pricePerNight),
                dateLabel,
                startDate: startDateStr,
                endDate: endDate.toISOString().slice(0, 10),
                nights: String(Math.max(1, nights)),
                guestsMin: String(guestsMin),
              },
            });
          }}
          disabled={!listingId || !parsedStart || !endDate}
        >
          <ThemedText style={styles.primaryBtnText}>Continue</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { marginTop: Spacing.five },
  title: { fontWeight: "700", fontSize: 18 },
  subtitle: { marginTop: Spacing.two },
  form: { gap: Spacing.three },
  label: { fontWeight: "600", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
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
  summary: { fontSize: 14, marginTop: Spacing.two },
  primaryBtn: {
    marginTop: Spacing.two,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
