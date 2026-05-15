import { AmenityIcon } from "@/components/listing-detail/amenity-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { Review } from "@/types/listing";
import { formatRelativeDate } from "@/utils/listing-fallbacks";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ListModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ListModal({ visible, title, onClose, children }: ListModalProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <View style={styles.spacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </ThemedView>
    </Modal>
  );
}

export function AmenitiesModalContent({ amenities }: { amenities: string[] }) {
  return (
    <View style={styles.amenityList}>
      {amenities.map((a) => (
        <View key={a} style={styles.amenityRow}>
          <AmenityIcon name={a} />
          <ThemedText style={styles.amenityLabel}>{a}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export function ReviewsModalContent({ reviews }: { reviews: Review[] }) {
  const theme = useTheme();
  return (
    <View style={styles.reviewList}>
      {reviews.map((r) => (
        <View key={r.id} style={[styles.reviewItem, { borderBottomColor: theme.border }]}>
          <View style={styles.reviewTop}>
            <ThemedText style={styles.reviewAuthor}>{r.author.name}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {formatRelativeDate(r.createdAt)}
            </ThemedText>
          </View>
          <ThemedText style={styles.stars}>{"★".repeat(r.rating)}</ThemedText>
          <ThemedText style={styles.reviewBody}>{r.comment}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700" },
  spacer: { width: 20 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  amenityList: { gap: Spacing.four },
  amenityRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  amenityLabel: { fontSize: 16 },
  reviewList: { gap: Spacing.four },
  reviewItem: {
    paddingBottom: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: { fontWeight: "700", fontSize: 15 },
  stars: { fontSize: 12, color: "#222" },
  reviewBody: { fontSize: 15, lineHeight: 22 },
});
