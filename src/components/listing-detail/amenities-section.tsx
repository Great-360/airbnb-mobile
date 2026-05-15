import { AmenityIcon } from "@/components/listing-detail/amenity-icon";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, View } from "react-native";

interface AmenitiesSectionProps {
  amenities: string[];
  onShowAll: () => void;
}

const PREVIEW_COUNT = 6;

export function AmenitiesSection({
  amenities,
  onShowAll,
}: AmenitiesSectionProps) {
  const theme = useTheme();
  const preview = amenities.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.heading}>What this place offers</ThemedText>
      <View style={styles.list}>
        {preview.map((amenity) => (
          <View key={amenity} style={styles.row}>
            <AmenityIcon name={amenity} />
            <ThemedText style={styles.label}>{amenity}</ThemedText>
          </View>
        ))}
      </View>
      {amenities.length > PREVIEW_COUNT && (
        <Pressable
          style={[styles.btn, { borderColor: theme.text }]}
          onPress={onShowAll}
        >
          <ThemedText style={styles.btnText}>
            Show all {amenities.length} amenities
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  heading: { fontSize: 20, fontWeight: "700" },
  list: { gap: Spacing.three },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  label: { fontSize: 16 },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
});
