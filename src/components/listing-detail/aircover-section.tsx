import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, View } from "react-native";

export function AirCoverSection() {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.logo}>
        <ThemedText style={{ color: Colors.light.primary }}>air</ThemedText>
        cover
      </ThemedText>
      <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
        Every booking includes free protection from Host cancellations, listing
        inaccuracies, and other issues like trouble checking in.
      </ThemedText>
      <Pressable>
        <ThemedText style={styles.link}>Learn more</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  logo: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  body: { fontSize: 14, lineHeight: 20 },
  link: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
