import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { Review } from "@/types/listing";
import { formatRelativeDate } from "@/utils/listing-fallbacks";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  total: number;
  onShowAll: () => void;
}

export function ReviewsSection({
  reviews,
  averageRating,
  total,
  onShowAll,
}: ReviewsSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap} nativeID="reviews-section">
      <ThemedText style={styles.heading}>
        ★ {averageRating.toFixed(2)} · {total} review{total === 1 ? "" : "s"}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {reviews.map((review) => (
          <View
            key={review.id}
            style={[styles.card, { borderColor: theme.border }]}
          >
            <ThemedText style={styles.comment} numberOfLines={4}>
              {review.comment}
            </ThemedText>
            <ThemedText style={styles.showMore}>Show more ›</ThemedText>
            <View style={styles.authorRow}>
              {review.author.avatar ? (
                <Image
                  source={{ uri: review.author.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPh]}>
                  <ThemedText style={styles.initial}>
                    {review.author.name.charAt(0)}
                  </ThemedText>
                </View>
              )}
              <View>
                <ThemedText style={styles.authorName}>
                  {review.author.name}
                </ThemedText>
                <ThemedText
                  style={[styles.date, { color: theme.textSecondary }]}
                >
                  {formatRelativeDate(review.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {total > 0 && (
        <Pressable
          style={[styles.btn, { borderColor: theme.text }]}
          onPress={onShowAll}
        >
          <ThemedText style={styles.btnText}>
            Show all {total} reviews
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingLeft: Spacing.four, gap: Spacing.three },
  heading: { fontSize: 20, fontWeight: "700" },
  card: {
    width: 280,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginRight: Spacing.three,
    gap: Spacing.two,
  },
  comment: { fontSize: 14, lineHeight: 20 },
  showMore: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPh: {
    backgroundColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontWeight: "600" },
  authorName: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 13 },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: Spacing.four,
    marginTop: Spacing.one,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
});
