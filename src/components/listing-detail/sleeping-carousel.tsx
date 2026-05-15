import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";
import { ScrollView, StyleSheet, View } from "react-native";

interface SleepingCarouselProps {
  guests: number;
  type: string;
}

export function SleepingCarousel({ guests, type }: SleepingCarouselProps) {
  const theme = useTheme();
  const bedLabel =
    guests <= 2 ? "1 queen bed" : `${Math.min(guests, 2)} beds`;

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.heading}>Where you&apos;ll sleep</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.card, { borderColor: theme.border }]}>
          <SymbolView
            name={{ ios: "bed.double.fill", android: "bed", web: "bed" }}
            size={28}
            tintColor={theme.text}
          />
          <ThemedText style={styles.roomTitle}>Bedroom</ThemedText>
          <ThemedText style={[styles.roomSub, { color: theme.textSecondary }]}>
            {bedLabel} · {type.toLowerCase()}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingLeft: Spacing.four, gap: Spacing.three },
  heading: { fontSize: 20, fontWeight: "700" },
  card: {
    width: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginRight: Spacing.three,
    gap: Spacing.two,
  },
  roomTitle: { fontSize: 16, fontWeight: "600" },
  roomSub: { fontSize: 14 },
});
