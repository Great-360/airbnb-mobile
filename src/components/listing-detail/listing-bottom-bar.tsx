import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ListingBottomBarProps {
  pricePerNight: number;
  dateLabel?: string;
  onReserve: () => void;
}

export function ListingBottomBar({
  pricePerNight,
  dateLabel = "Jun 25 – 30",
  onReserve,
}: ListingBottomBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.two),
          borderTopColor: theme.border,
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.left}>
        <ThemedText style={styles.price}>
          <ThemedText style={styles.priceBold}>
            ${pricePerNight.toLocaleString()}
          </ThemedText>{" "}
          night
        </ThemedText>
        <ThemedText style={[styles.dates, { color: theme.textSecondary }]}>
          {dateLabel}
        </ThemedText>
      </View>
      <Pressable
        style={[styles.reserve, { backgroundColor: Colors.light.primary }]}
        onPress={onReserve}
      >
        <ThemedText style={styles.reserveText}>Reserve</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  left: { gap: 2 },
  price: { fontSize: 15 },
  priceBold: { fontWeight: "700", fontSize: 17 },
  dates: { fontSize: 13, textDecorationLine: "underline" },
  reserve: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
    alignItems: "center",
  },
  reserveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
