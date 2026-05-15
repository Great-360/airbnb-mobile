import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

interface HighlightRowProps {
  icon: { ios: string; android: string; web: string };
  title: string;
  subtitle: string;
}

export function HighlightRow({ icon, title, subtitle }: HighlightRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <SymbolView
        name={icon as Parameters<typeof SymbolView>[0]["name"]}
        size={26}
        tintColor={theme.text}
      />
      <View style={styles.text}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

export function HighlightsSection() {
  return (
    <View style={styles.wrap}>
      <HighlightRow
        icon={{ ios: "key.fill", android: "vpn_key", web: "vpn_key" }}
        title="Self check-in"
        subtitle="Check yourself in with the keypad."
      />
      <HighlightRow
        icon={{ ios: "mappin.and.ellipse", android: "place", web: "place" }}
        title="Great location"
        subtitle="100% of recent guests gave the location a 5-star rating."
      />
      <HighlightRow
        icon={{ ios: "calendar", android: "event", web: "event" }}
        title="Free cancellation before Jun 21"
        subtitle="Get a full refund if you change your mind."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  row: { flexDirection: "row", gap: Spacing.three, alignItems: "flex-start" },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 14, lineHeight: 20 },
});
