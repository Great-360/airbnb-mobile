import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, View } from "react-native";

interface ListingHeaderProps {
  title: string;
  rating: number | null;
  reviewCount: number;
  location: string;
  onReviewsPress?: () => void;
}

export function ListingHeader({
  title,
  rating,
  reviewCount,
  location,
  onReviewsPress,
}: ListingHeaderProps) {
  const theme = useTheme();
  const displayRating = rating ?? 0;

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.metaRow}>
        <Pressable style={styles.ratingRow} onPress={onReviewsPress}>
          <ThemedText style={styles.star}>★</ThemedText>
          <ThemedText style={styles.rating}>{displayRating.toFixed(2)}</ThemedText>
          <ThemedText style={[styles.reviews, { color: theme.textSecondary }]}>
            · {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText style={[styles.location, { color: theme.textSecondary }]}>
        Room in {location}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: 6 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { fontSize: 12 },
  rating: { fontSize: 14, fontWeight: "600" },
  reviews: { fontSize: 14, textDecorationLine: "underline" },
  location: { fontSize: 14 },
});
